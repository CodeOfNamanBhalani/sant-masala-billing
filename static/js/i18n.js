/**
 * Sant Masala - Internationalization (i18n)
 * Supports English and Gujarati
 */

const translations = {
    en: {
        // General
        app_name: 'Sant Masala',
        tagline: 'Real Taste For Real People!',
        welcome: 'Welcome',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        all: 'All',
        active: 'Active',
        inactive: 'Inactive',
        yes: 'Yes',
        no: 'No',
        actions: 'Actions',
        status: 'Status',
        
        // Navigation
        dashboard: 'Dashboard',
        products: 'Products',
        categories: 'Categories',
        orders: 'Orders',
        customers: 'Customers',
        settings: 'Settings',
        pos: 'Billing',
        logout: 'Logout',
        
        // Dashboard
        total_orders: 'Total Orders',
        total_revenue: 'Total Revenue',
        total_products: 'Total Products',
        low_stock_items: 'Low Stock Items',
        recent_orders: 'Recent Orders',
        order_number: 'Order #',
        customer: 'Customer',
        amount: 'Amount',
        date: 'Date',
        
        // Products
        add_product: 'Add Product',
        edit_product: 'Edit Product',
        product_name: 'Product Name',
        product_name_gu: 'Product Name (Gujarati)',
        description: 'Description',
        category: 'Category',
        price: 'Price',
        stock: 'Stock',
        weight: 'Weight',
        unit: 'Unit',
        image: 'Image',
        featured: 'Featured',
        prices_variants: 'Price Variants',
        add_price: 'Add Price Variant',
        
        // Categories
        add_category: 'Add Category',
        edit_category: 'Edit Category',
        category_name: 'Category Name',
        display_order: 'Display Order',
        product_count: 'Products',
        
        // Orders
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        payment_status: 'Payment Status',
        paid: 'Paid',
        unpaid: 'Unpaid',
        refunded: 'Refunded',
        order_details: 'Order Details',
        
        // POS
        cart: 'Cart',
        clear_cart: 'Clear',
        subtotal: 'Subtotal',
        discount: 'Discount',
        tax: 'Tax',
        total: 'Total',
        pay: 'Pay',
        print_bill: 'Print Bill',
        cash: 'Cash',
        upi: 'UPI',
        card: 'Card',
        customer_name: 'Customer Name',
        phone: 'Phone',
        add_to_cart: 'Add to Cart',
        select_weight: 'Select Weight',
        quantity: 'Qty',
        empty_cart: 'Cart is empty',
        hold: 'Hold',
        order_held: 'Order held successfully',
        held_orders: 'Held Orders',
        retrieve_held_order: 'Retrieve',
        no_held_orders: 'No held orders',
        
        // Settings
        shop_name: 'Shop Name',
        shop_address: 'Shop Address',
        shop_phone: 'Shop Phone',
        gst_number: 'GST Number',
        currency: 'Currency',
        tax_rate: 'Tax Rate (%)',
        printer_type: 'Printer Type',
        printer_width: 'Printer Width (mm)',
        save_settings: 'Save Settings',
        
        // Messages
        confirm_delete: 'Are you sure you want to delete?',
        saved_success: 'Saved successfully!',
        deleted_success: 'Deleted successfully!',
        error_occurred: 'An error occurred',
        no_products: 'No products found',
        no_orders: 'No orders found',
        
        // Bill
        invoice: 'INVOICE',
        bill_no: 'Bill No',
        date_time: 'Date & Time',
        item: 'Item',
        qty: 'Qty',
        rate: 'Rate',
        thank_you: 'Thank You! Visit Again!',
        terms: 'Terms & Conditions Apply'
    },
    
    gu: {
        // General
        app_name: 'સંત મસાલા',
        tagline: 'અસલી સ્વાદ અસલી લોકો માટે!',
        welcome: 'સ્વાગત છે',
        loading: 'લોડ થઈ રહ્યું છે...',
        save: 'સેવ કરો',
        cancel: 'રદ કરો',
        delete: 'કાઢી નાખો',
        edit: 'સંપાદિત કરો',
        add: 'ઉમેરો',
        search: 'શોધો',
        filter: 'ફિલ્ટર',
        all: 'બધા',
        active: 'સક્રિય',
        inactive: 'નિષ્ક્રિય',
        yes: 'હા',
        no: 'ના',
        actions: 'ક્રિયાઓ',
        status: 'સ્થિતિ',
        
        // Navigation
        dashboard: 'ડેશબોર્ડ',
        products: 'ઉત્પાદનો',
        categories: 'શ્રેણીઓ',
        orders: 'ઓર્ડર્સ',
        customers: 'ગ્રાહકો',
        settings: 'સેટિંગ્સ',
        pos: 'બિલિંગ',
        logout: 'લોગઆઉટ',
        
        // Dashboard
        total_orders: 'કુલ ઓર્ડર',
        total_revenue: 'કુલ આવક',
        total_products: 'કુલ ઉત્પાદનો',
        low_stock_items: 'ઓછો સ્ટોક',
        recent_orders: 'તાજેતરના ઓર્ડર',
        order_number: 'ઓર્ડર #',
        customer: 'ગ્રાહક',
        amount: 'રકમ',
        date: 'તારીખ',
        
        // Products
        add_product: 'ઉત્પાદન ઉમેરો',
        edit_product: 'ઉત્પાદન સંપાદિત કરો',
        product_name: 'ઉત્પાદનનું નામ',
        product_name_gu: 'ઉત્પાદનનું નામ (ગુજરાતી)',
        description: 'વર્ણન',
        category: 'શ્રેણી',
        price: 'કિંમત',
        stock: 'સ્ટોક',
        weight: 'વજન',
        unit: 'એકમ',
        image: 'છબી',
        featured: 'ફીચર્ડ',
        prices_variants: 'ભાવ વેરિઅન્ટ્સ',
        add_price: 'ભાવ ઉમેરો',
        
        // Categories
        add_category: 'શ્રેણી ઉમેરો',
        edit_category: 'શ્રેણી સંપાદિત કરો',
        category_name: 'શ્રેણીનું નામ',
        display_order: 'ક્રમ',
        product_count: 'ઉત્પાદનો',
        
        // Orders
        pending: 'બાકી',
        completed: 'પૂર્ણ',
        cancelled: 'રદ',
        processing: 'પ્રક્રિયામાં',
        shipped: 'મોકલેલ',
        delivered: 'ડિલિવર',
        payment_status: 'ચુકવણી સ્થિતિ',
        paid: 'ચૂકવેલ',
        unpaid: 'બાકી',
        refunded: 'રિફંડ',
        order_details: 'ઓર્ડર વિગતો',
        
        // POS
        cart: 'કાર્ટ',
        clear_cart: 'ખાલી કરો',
        subtotal: 'પેટા કુલ',
        discount: 'ડિસ્કાઉન્ટ',
        tax: 'ટેક્સ',
        total: 'કુલ',
        pay: 'ચૂકવો',
        print_bill: 'બિલ પ્રિન્ટ કરો',
        cash: 'રોકડ',
        upi: 'યુપીઆઈ',
        card: 'કાર્ડ',
        customer_name: 'ગ્રાહકનું નામ',
        phone: 'ફોન',
        add_to_cart: 'કાર્ટમાં ઉમેરો',
        select_weight: 'વજન પસંદ કરો',
        quantity: 'જથ્થો',
        empty_cart: 'કાર્ટ ખાલી છે',
        hold: 'રોકો',
        order_held: 'ઓર્ડર સફળતાપૂર્વક રોકાયો',
        held_orders: 'રોકાયેલ ઓર્ડર્સ',
        retrieve_held_order: 'પુનઃપ્રાપ્ત કરો',
        no_held_orders: 'કોઈ રોકાયેલ ઓર્ડર નથી',
        
        // Settings
        shop_name: 'દુકાનનું નામ',
        shop_address: 'દુકાનનું સરનામું',
        shop_phone: 'દુકાનનો ફોન',
        gst_number: 'GST નંબર',
        currency: 'ચલણ',
        tax_rate: 'ટેક્સ દર (%)',
        printer_type: 'પ્રિન્ટર પ્રકાર',
        printer_width: 'પ્રિન્ટર પહોળાઈ (mm)',
        save_settings: 'સેટિંગ્સ સેવ કરો',
        
        // Messages
        confirm_delete: 'શું તમે ખરેખર કાઢી નાખવા માંગો છો?',
        saved_success: 'સફળતાપૂર્વક સેવ થયું!',
        deleted_success: 'સફળતાપૂર્વક કાઢી નાખ્યું!',
        error_occurred: 'એક ભૂલ આવી',
        no_products: 'કોઈ ઉત્પાદન મળ્યું નથી',
        no_orders: 'કોઈ ઓર્ડર મળ્યો નથી',
        
        // Bill
        invoice: 'બિલ',
        bill_no: 'બિલ નં',
        date_time: 'તારીખ અને સમય',
        item: 'આઇટમ',
        qty: 'જથ્થો',
        rate: 'દર',
        thank_you: 'આભાર! ફરી પધારો!',
        terms: 'નિયમો અને શરતો લાગુ'
    }
};

// Current language
let currentLang = localStorage.getItem('lang') || 'en';

/**
 * Get translation for a key
 */
function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

/**
 * Set language
 */
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    updatePageTranslations();
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

/**
 * Update all translations on page
 */
function updatePageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = t(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        el.placeholder = t(key);
    });
}

/**
 * Get current language
 */
function getCurrentLang() {
    return currentLang;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updatePageTranslations();
});
