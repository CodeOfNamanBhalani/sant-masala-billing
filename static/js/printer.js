/**
 * Sant Masala - Thermal Printer Module
 * Supports USB and Bluetooth ESC/POS Printers
 * Compatible with 58mm thermal printers
 */

const ThermalPrinter = {
    // Printer settings
    settings: {
        width: 32, // Characters per line for 58mm printer
        encoding: 'utf-8',
        printerType: 'usb' // usb, bluetooth, network
    },

    // Bluetooth printer state
    bluetooth: {
        device: null,
        server: null,
        service: null,
        characteristic: null,
        connected: false,
        reconnecting: false,
        serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
        charUUID: '00002af1-0000-1000-8000-00805f9b34fb',
    },

    // ESC/POS Commands
    ESC: '\x1B',
    GS: '\x1D',

    // Command builders
    commands: {
        init: '\x1B\x40',                    // Initialize printer
        cut: '\x1D\x56\x00',                 // Full cut
        partialCut: '\x1D\x56\x01',          // Partial cut
        alignLeft: '\x1B\x61\x00',
        alignCenter: '\x1B\x61\x01',
        alignRight: '\x1B\x61\x02',
        bold: '\x1B\x45\x01',
        boldOff: '\x1B\x45\x00',
        doubleHeight: '\x1B\x21\x10',
        doubleWidth: '\x1B\x21\x20',
        doubleSize: '\x1B\x21\x30',
        normalSize: '\x1B\x21\x00',
        underline: '\x1B\x2D\x01',
        underlineOff: '\x1B\x2D\x00',
        feed: (lines) => '\x1B\x64' + String.fromCharCode(lines),
        beep: '\x1B\x42\x03\x02'             // Beep 3 times
    },

    /**
     * Generate receipt text
     */
    generateReceipt(data) {
        const { shop, order } = data;
        const width = this.settings.width;
        const divider = '-'.repeat(width);
        const doubleDivider = '='.repeat(width);

        let receipt = '';

        // Initialize
        receipt += this.commands.init;

        // Header - Shop Name (centered, large)
        receipt += this.commands.alignCenter;
        receipt += this.commands.doubleSize;
        receipt += shop.name + '\n';
        receipt += this.commands.normalSize;
        receipt += shop.name_gu + '\n';

        // Address and Phone
        receipt += this.commands.normalSize;
        if (shop.address) {
            receipt += shop.address + '\n';
        }
        if (shop.phone) {
            receipt += 'Ph: ' + shop.phone + '\n';
        }
        if (shop.gst) {
            receipt += 'GST: ' + shop.gst + '\n';
        }

        receipt += divider + '\n';

        // Bill Info
        receipt += this.commands.alignLeft;
        receipt += this.commands.bold;
        receipt += 'BILL / બિલ\n';
        receipt += this.commands.boldOff;
        receipt += 'Bill No: ' + order.order_number + '\n';
        receipt += 'Date: ' + order.created_at + '\n';

        if (order.customer_name) {
            receipt += 'Customer: ' + order.customer_name + '\n';
        }
        if (order.customer_phone) {
            receipt += 'Phone: ' + order.customer_phone + '\n';
        }

        receipt += doubleDivider + '\n';

        // Items Header
        receipt += this.commands.bold;
        receipt += this.formatLine('Item', 'Qty', 'Amt', width);
        receipt += this.commands.boldOff;
        receipt += divider + '\n';

        // Items
        order.items.forEach(item => {
            // Product name
            receipt += item.product_name + '\n';
            if (item.product_name_gu) {
                receipt += '  ' + item.product_name_gu + '\n';
            }

            // Weight and price on same line
            const weightText = `${item.weight}${item.weight_unit}x${item.quantity}`;
            const priceText = `@${item.price}`;
            const totalText = item.total.toFixed(2);
            receipt += this.formatLine('  ' + weightText, priceText, totalText, width);
        });

        receipt += doubleDivider + '\n';

        // Totals
        receipt += this.formatLine('Subtotal:', '', order.subtotal.toFixed(2), width);

        if (order.discount > 0) {
            receipt += this.formatLine('Discount:', '', '-' + order.discount.toFixed(2), width);
        }

        if (order.tax > 0) {
            receipt += this.formatLine('Tax:', '', order.tax.toFixed(2), width);
        }

        receipt += divider + '\n';
        receipt += this.commands.bold;
        receipt += this.commands.doubleHeight;
        receipt += this.formatLine('TOTAL:', '', 'Rs.' + order.total.toFixed(2), width);
        receipt += this.commands.normalSize;
        receipt += this.commands.boldOff;

        receipt += divider + '\n';

        // Payment Info
        const paymentMap = {
            'cash': 'CASH / રોકડ',
            'upi': 'UPI / યુપીઆઈ',
            'card': 'CARD / કાર્ડ'
        };
        receipt += 'Payment: ' + (paymentMap[order.payment_method] || order.payment_method) + '\n';

        receipt += '\n';

        // Footer
        receipt += this.commands.alignCenter;
        receipt += 'Thank You! Visit Again!\n';
        receipt += 'આભાર! ફરી પધારો!\n';
        receipt += '\n';
        receipt += 'Terms & Conditions Apply\n';

        // Feed and cut
        receipt += this.commands.feed(4);
        receipt += this.commands.cut;

        return receipt;
    },

    /**
     * Format a line with left, center, and right alignment
     */
    formatLine(left, center, right, width) {
        left = left || '';
        center = center || '';
        right = right || '';

        const totalLen = left.length + center.length + right.length;
        const padding = width - totalLen;

        if (center) {
            const leftPad = Math.floor(padding / 2);
            const rightPad = padding - leftPad;
            return left + ' '.repeat(leftPad) + center + ' '.repeat(rightPad) + right + '\n';
        } else {
            return left + ' '.repeat(Math.max(0, padding)) + right + '\n';
        }
    },

    /**
     * Print receipt using Web USB API (for USB printers)
     */
    async printUSB(receiptText) {
        if (!navigator.usb) {
            throw new Error('Web USB not supported in this browser');
        }

        try {
            // Request USB device
            const device = await navigator.usb.requestDevice({
                filters: [
                    { classCode: 7 }, // Printer class
                    // Common thermal printer vendors
                    { vendorId: 0x0416 }, // Winbond (common for cheap printers)
                    { vendorId: 0x0483 }, // STMicroelectronics
                    { vendorId: 0x04B8 }, // Epson
                    { vendorId: 0x0519 }, // Star Micronics
                ]
            });

            await device.open();

            if (device.configuration === null) {
                await device.selectConfiguration(1);
            }

            await device.claimInterface(0);

            // Find bulk out endpoint
            const endpointOut = device.configuration.interfaces[0].alternate.endpoints
                .find(e => e.direction === 'out');

            if (!endpointOut) {
                throw new Error('No output endpoint found');
            }

            // Convert text to bytes
            const encoder = new TextEncoder();
            const data = encoder.encode(receiptText);

            // Send data
            await device.transferOut(endpointOut.endpointNumber, data);

            await device.close();

            console.log('Print sent to USB printer');
            return true;

        } catch (error) {
            console.error('USB print error:', error);
            throw error;
        }
    },

    /**
     * Print receipt using Web Bluetooth API (for Bluetooth printers)
     */
    async printBluetooth(receiptText) {
        if (!navigator.bluetooth) {
            throw new Error('Web Bluetooth not supported in this browser');
        }
        try {
            // Use existing connection if available
            if (!this.bluetooth.connected || !this.bluetooth.characteristic) {
                await this.connectBluetoothPrinter();
            }
            if (!this.bluetooth.connected || !this.bluetooth.characteristic) {
                throw new Error('Bluetooth printer not connected');
            }
            // Convert text to bytes
            const encoder = new TextEncoder();
            const data = encoder.encode(receiptText);
            // Split into chunks (Bluetooth has MTU limits)
            const chunkSize = 20;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                await this.bluetooth.characteristic.writeValue(chunk);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            console.log('Print sent to Bluetooth printer');
            return true;
        } catch (error) {
            this.bluetooth.connected = false;
            this.bluetooth.characteristic = null;
            console.error('Bluetooth print error:', error);
            throw error;
        }
    },

    /**
     * Connect to Bluetooth printer (with device selection or auto-reconnect)
     */
    async connectBluetoothPrinter(forceSelect = false) {
        if (!navigator.bluetooth) {
            showToast('Web Bluetooth not supported', 'error');
            return null;
        }
        try {
            let device = null;
            // Try auto-reconnect from localStorage
            if (!forceSelect) {
                const saved = localStorage.getItem('bluetoothPrinter');
                if (saved) {
                    device = await navigator.bluetooth.requestDevice({
                        filters: [{ services: [this.bluetooth.serviceUUID] }],
                        optionalServices: [this.bluetooth.serviceUUID],
                        acceptAllDevices: false
                    });
                }
            }
            // If not found or forceSelect, prompt user
            if (!device) {
                device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: [this.bluetooth.serviceUUID] }],
                    optionalServices: [this.bluetooth.serviceUUID]
                });
                // Save device id for future auto-reconnect
                localStorage.setItem('bluetoothPrinter', device.id);
            }
            this.bluetooth.device = device;
            this.bluetooth.server = await device.gatt.connect();
            this.bluetooth.service = await this.bluetooth.server.getPrimaryService(this.bluetooth.serviceUUID);
            this.bluetooth.characteristic = await this.bluetooth.service.getCharacteristic(this.bluetooth.charUUID);
            this.bluetooth.connected = true;
            // Listen for disconnect
            device.addEventListener('gattserverdisconnected', () => {
                this.bluetooth.connected = false;
                this.bluetooth.characteristic = null;
                this.autoReconnectPrinter();
            });
            showToast('Bluetooth printer connected');
            return device;
        } catch (err) {
            showToast('Bluetooth printer connection failed', 'error');
            this.bluetooth.connected = false;
            this.bluetooth.characteristic = null;
            return null;
        }
    },

    /**
     * Auto-reconnect to last Bluetooth printer
     */
    async autoReconnectPrinter() {
        if (this.bluetooth.reconnecting) return;
        this.bluetooth.reconnecting = true;
        const saved = localStorage.getItem('bluetoothPrinter');
        if (!saved) {
            this.bluetooth.reconnecting = false;
            return;
        }
        try {
            await this.connectBluetoothPrinter(false);
        } catch (e) {
            // Ignore
        }
        this.bluetooth.reconnecting = false;
    },

    /**
     * Print receipt using ESC/POS encoding (Bluetooth only)
     */
    async printReceiptESCPOSEncode(receiptData) {
        const receiptText = this.generateReceipt(receiptData);
        try {
            await this.printBluetooth(receiptText);
            showToast('Receipt printed (Bluetooth)');
        } catch (err) {
            showToast('Bluetooth print failed', 'error');
            // Fallback
            this.printBrowser(receiptData);
        }
    },

    /**
     * Print using browser's print dialog (fallback)
     */
    printBrowser(receiptData) {
        const { shop, order } = receiptData;

        // Create print-friendly HTML
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Receipt - ${order.order_number}</title>
                <style>
                    @page {
                        size: 58mm auto;
                        margin: 2mm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 11px;
                        font-weight: 500;
                        color: #000000;
                        width: 54mm;
                        padding: 2mm;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .large { font-size: 15px; }
                    .divider { border-top: 1px dashed #000; margin: 3mm 0; }
                    .double { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 1mm 0; margin: 3mm 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 1mm 0; vertical-align: top; }
                    .right { text-align: right; }
                    .total-row { font-size: 13px; font-weight: bold; }
                    .gujarati { font-family: 'Noto Sans Gujarati', sans-serif; }
                </style>
            </head>
            <body>
                <div class="center">
                    <div class="bold large">${shop.name}</div>
                    <div class="gujarati">${shop.name_gu}</div>
                    ${shop.address ? `<div>${shop.address}</div>` : ''}
                    ${shop.phone ? `<div>Ph: ${shop.phone}</div>` : ''}
                    ${shop.gst ? `<div>GST: ${shop.gst}</div>` : ''}
                </div>
                
                <div class="divider"></div>
                
                <div class="bold">BILL / બિલ</div>
                <div>Bill No: ${order.order_number}</div>
                <div>Date: ${order.created_at}</div>
                ${order.customer_name ? `<div>Customer: ${order.customer_name}</div>` : ''}
                ${order.customer_phone ? `<div>Phone: ${order.customer_phone}</div>` : ''}
                
                <div class="double"></div>
                
                <table>
                    <tr class="bold">
                        <td>Item</td>
                        <td class="right">Qty</td>
                        <td class="right">Amt</td>
                    </tr>
                </table>
                
                <div class="divider"></div>
                
                <table>
                    ${order.items.map(item => `
                        <tr>
                            <td colspan="3">
                                ${item.product_name}
                                ${item.product_name_gu ? `<br><span class="gujarati">${item.product_name_gu}</span>` : ''}
                            </td>
                        </tr>
                        <tr>
                            <td>&nbsp;&nbsp;${item.weight}${item.weight_unit} @${item.price}</td>
                            <td class="right">${item.quantity}</td>
                            <td class="right">${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </table>
                
                <div class="double"></div>
                
                <table>
                    <tr>
                        <td>Subtotal:</td>
                        <td class="right">${order.subtotal.toFixed(2)}</td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                        <td>Discount:</td>
                        <td class="right">-${order.discount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${order.tax > 0 ? `
                    <tr>
                        <td>Tax:</td>
                        <td class="right">${order.tax.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                </table>
                
                <div class="divider"></div>
                
                <table>
                    <tr class="total-row">
                        <td>TOTAL:</td>
                        <td class="right">₹${order.total.toFixed(2)}</td>
                    </tr>
                </table>
                
                <div class="divider"></div>
                
                <div>Payment: ${order.payment_method.toUpperCase()}</div>
                
                <br>
                
                <div class="center">
                    <div>Thank You! Visit Again!</div>
                    <div class="gujarati">આભાર! ફરી પધારો!</div>
                    <br>
                    <div style="font-size: 9px;">Terms & Conditions Apply</div>
                </div>
            </body>
            </html>
        `;

        // Open print window
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = function () {
            printWindow.focus();
            printWindow.print();
            // printWindow.close();
        };
    },

    /**
     * Main print function - tries different methods
     */
    async printReceipt(receiptData) {
        // If Web Bluetooth supported and user prefers Bluetooth, use it
        const printerType = localStorage.getItem('printerType') || 'browser';
        if (printerType === 'bluetooth' && navigator.bluetooth) {
            await this.printReceiptESCPOSEncode(receiptData);
            return;
        }
        // USB printing (desktop)
        if (printerType === 'usb' && navigator.usb) {
            const receiptText = this.generateReceipt(receiptData);
            try {
                await this.printUSB(receiptText);
                showToast('Receipt printed (USB)');
            } catch (err) {
                showToast('USB print failed', 'error');
                this.printBrowser(receiptData);
            }
            return;
        }
        // Fallback: browser print
        this.printBrowser(receiptData);
    },

    /**
     * Test printer connection
     */
    async testPrint() {
        const testData = {
            shop: {
                name: 'Sant Masala',
                name_gu: 'સંત મસાલા',
                address: 'Main Market',
                phone: '+91 98765 43210'
            },
            order: {
                order_number: 'TEST001',
                created_at: new Date().toLocaleString('en-IN'),
                customer_name: 'Test Customer',
                items: [
                    {
                        product_name: 'Test Item',
                        product_name_gu: 'ટેસ્ટ આઇટમ',
                        weight: 100,
                        weight_unit: 'g',
                        quantity: 1,
                        price: 50,
                        total: 50
                    }
                ],
                subtotal: 50,
                discount: 0,
                tax: 0,
                total: 50,
                payment_method: 'cash'
            }
        };

        await this.printReceipt(testData);
    },

    /**
     * Manual disconnect for Bluetooth printer
     */
    async disconnectBluetoothPrinter() {
        if (this.bluetooth.device && this.bluetooth.device.gatt.connected) {
            await this.bluetooth.device.gatt.disconnect();
            this.bluetooth.connected = false;
            this.bluetooth.characteristic = null;
            showToast('Bluetooth printer disconnected');
        }
    }
};



// Export for use
window.ThermalPrinter = ThermalPrinter;
