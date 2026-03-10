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
     * Print using browser's print dialog (fallback) - 80mm Bill Style
     */
    printBrowser(receiptData) {
        const { shop, order } = receiptData;

        // Build item rows with Sr number, Gujarati name, Qty, Rate, Total
        const MIN_ROWS = 8; // minimum rows so bill is never too short
        let srNum = 1;
        const dataRows = order.items.map(item => {
            const name = item.product_name_gu || item.product_name;
            const qty = `${item.weight}${item.weight_unit}`;
            const rate = `${item.price}/kg`;
            const total = `&#x20B9;${item.total.toFixed(2)}`;
            return `
                <tr>
                    <td class="col-sr">${srNum++}</td>
                    <td class="col-item">${name}</td>
                    <td class="col-qty">${qty}</td>
                    <td class="col-rate">${rate}</td>
                    <td class="col-total">${total}</td>
                </tr>`;
        });
        // Pad with blank rows to reach minimum height
        const blankCount = Math.max(0, MIN_ROWS - dataRows.length);
        const blankRows = Array(blankCount).fill(
            `<tr class="blank-row">
                <td class="col-sr">&nbsp;</td>
                <td class="col-item">&nbsp;</td>
                <td class="col-qty">&nbsp;</td>
                <td class="col-rate">&nbsp;</td>
                <td class="col-total">&nbsp;</td>
            </tr>`
        );
        const itemRows = [...dataRows, ...blankRows].join('');

        // Total qty (sum of quantities)
        const totalQty = order.items.reduce((s, i) => s + i.quantity, 0).toFixed(2);

        // Create print-friendly HTML
        const html = `<!DOCTYPE html>
<html lang="gu">
<head>
    <meta charset="UTF-8">
    <title>Bill - ${order.order_number}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        @media print {
            html, body {
                width: 80mm;
                margin: 0;
                padding: 0;
            }
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', 'Noto Sans Gujarati', monospace;
            font-size: 15px;
            font-weight: 800;
            color: #000;
            width: 80mm;
            margin: 0 auto;
            padding: 2mm 2mm 4mm 2mm;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }

        /* ── HEADER BOX ── */
        .header-box {
            border: 2px solid #000;
            text-align: center;
            padding: 3px 4px;
            margin-bottom: 0;
        }
        .shop-name-en {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 1px;
            line-height: 1.2;
        }
        .shop-name-gu {
            font-family: 'Noto Sans Gujarati', sans-serif;
            font-size: 17px;
            font-weight: 800;
            line-height: 1.3;
        }
        .shop-address {
            font-size: 13px;
            font-weight: 700;
            line-height: 1.4;
        }
        .shop-phone {
            font-size: 14px;
            font-weight: 800;
        }

        /* ── TITLE BOX ── */
        .title-box {
            border: 2px solid #000;
            border-top: none;
            text-align: center;
            padding: 5px 0;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 3px;
        }

        /* ── BILL DETAILS BOX ── */
        .details-box {
            border: 2px solid #000;
            border-top: none;
            padding: 4px 6px;
            font-size: 14px;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            line-height: 1.8;
        }
        .details-divider {
            border-top: 1.5px dashed #000;
            margin: 3px 0;
        }

        /* ── ITEM TABLE ── */
        .item-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            border-top: none;
            font-size: 14px;
        }
        .item-table th,
        .item-table td {
            border: 2px solid #000;
            padding: 5px 3px;
            line-height: 1.4;
        }
        .item-table thead th {
            text-align: center;
            font-size: 14px;
            font-weight: 900;
            background: #fff;
        }
        .blank-row td {
            height: 22px;
            border-color: #000;
        }

        /* Column alignments */
        .col-sr   { text-align: center; width: 24px;  white-space: nowrap; font-weight: 800; }
        .col-item { text-align: left;   width: auto;  font-family: 'Noto Sans Gujarati', 'Courier New', monospace; font-weight: 800; }
        .col-qty  { text-align: center; width: 40px;  white-space: nowrap; font-weight: 800; }
        .col-rate { text-align: center; width: 48px;  white-space: nowrap; font-weight: 800; }
        .col-total{ text-align: right;  width: 46px;  white-space: nowrap; font-weight: 800; }

        /* ── TOTAL ROW (inside table) ── */
        .total-row td {
            font-size: 15px;
            font-weight: 900;
            background: #fff;
            border-top: 2px solid #000;
        }
        .total-row .col-item {
            text-align: center;
            font-weight: 900;
        }
        .total-row .col-total {
            font-size: 16px;
            font-weight: 900;
        }

        /* ── FOOTER ── */
        .footer {
            border: 2px solid #000;
            border-top: none;
            text-align: center;
            padding: 6px 2px;
            font-size: 14px;
            font-weight: 800;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header-box">
        <div class="shop-name-en">${shop.name}</div>
        <div class="shop-name-gu">${shop.name_gu || ''}</div>
        ${shop.address ? `<div class="shop-address">${shop.address}</div>` : ''}
        ${shop.phone ? `<div class="shop-phone">Mo: ${shop.phone}</div>` : ''}
    </div>

    <!-- BILL TITLE -->
    <div class="title-box">BILL</div>

    <!-- BILL DETAILS -->
    <div class="details-box">
        <div class="details-row">
            <span>Bill No: <strong>${order.order_number}</strong></span>
            <span>Date: <strong>${order.created_at}</strong></span>
        </div>
        <div class="details-divider"></div>
        <div class="details-row">
            <span>Buyer Name: <strong>${order.customer_name || 'Cash Ac'}</strong></span>
        </div>
        <div class="details-row">
            <span>Mobile No: <strong>${order.customer_phone || '—'}</strong></span>
        </div>
    </div>

    <!-- ITEMS TABLE -->
    <table class="item-table">
        <thead>
            <tr>
                <th class="col-sr">Sr</th>
                <th class="col-item">Item</th>
                <th class="col-qty">Qty</th>
                <th class="col-rate">Rate</th>
                <th class="col-total">Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
            <!-- TOTAL ROW inside table -->
            <tr class="total-row">
                <td class="col-sr"></td>
                <td class="col-item" style="text-align:center;font-weight:900;">Total</td>
                <td class="col-qty">${totalQty}</td>
                <td class="col-rate"></td>
                <td class="col-total">&#x20B9;${order.total.toFixed(2)}</td>
            </tr>
        </tbody>
    </table>

    <!-- FOOTER -->
    <div class="footer">Thank you for business with us.</div>

</body>
</html>`;

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
     * Print via WiFi/Network ESC/POS (TCP port 9100)
     * Sends ESC/POS bytes to Flask backend which forwards to printer over TCP
     */
    async printNetwork(receiptData) {
        const receiptText = this.generateReceipt(receiptData);

        // Encode ESC/POS string to bytes then to base64
        const encoder = new TextEncoder();
        const bytes = encoder.encode(receiptText);
        const b64 = btoa(String.fromCharCode(...bytes));

        // Get IP and port from localStorage (saved from settings)
        const ip = localStorage.getItem('printerIp') || '';
        const port = parseInt(localStorage.getItem('printerPort') || '9100');

        if (!ip) {
            showToast('WiFi Printer IP not set. Go to Settings → Printer.', 'warning');
            throw new Error('No printer IP configured');
        }

        const response = await fetch('/api/print/network', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_b64: b64, ip, port })
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Network print failed');
        }
        return result;
    },

    /**
     * Test if WiFi printer is reachable
     */
    async testNetworkConnection(ip, port) {
        const response = await fetch('/api/print/test-network', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ip || localStorage.getItem('printerIp'), port: port || parseInt(localStorage.getItem('printerPort') || '9100') })
        });
        return await response.json();
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
        // WiFi / Network printing (ESC/POS over TCP port 9100)
        if (printerType === 'network') {
            try {
                await this.printNetwork(receiptData);
                showToast('✅ Receipt printed (WiFi Printer)');
            } catch (err) {
                showToast('WiFi print failed: ' + err.message, 'error');
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
