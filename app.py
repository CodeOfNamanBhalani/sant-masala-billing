"""
Sant Masala - Grocery Store Billing Software
Flask Backend with ESC/POS Thermal Printer Support
Bilingual: English + Gujarati
"""

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
from werkzeug.utils import secure_filename
import json
import os
import uuid
import base64

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'sant-masala-secret-key-2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres.raxfzrqlqsvrcskcgtbl:santmasala-billing@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== DATABASE MODELS ====================

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name_en = db.Column(db.String(100), nullable=False)
    name_gu = db.Column(db.String(100), nullable=False)
    description_en = db.Column(db.Text)
    description_gu = db.Column(db.Text)
    image = db.Column(db.String(255))
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name_en': self.name_en,
            'name_gu': self.name_gu,
            'description_en': self.description_en,
            'description_gu': self.description_gu,
            'image': self.image,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'product_count': len(self.products)
        }


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name_en = db.Column(db.String(100), nullable=False)
    name_gu = db.Column(db.String(100), nullable=False)
    description_en = db.Column(db.Text)
    description_gu = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    image = db.Column(db.String(255))
    stock = db.Column(db.Integer, default=0)
    unit = db.Column(db.String(20), default='kg')  # kg, g, piece, packet
    price_per_kg = db.Column(db.Float)  # Price for 1kg, used for weight-based products
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    prices = db.relationship('ProductPrice', backref='product', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name_en': self.name_en,
            'name_gu': self.name_gu,
            'description_en': self.description_en,
            'description_gu': self.description_gu,
            'category_id': self.category_id,
            'category_name': self.category.name_en if self.category else '',
            'category_name_gu': self.category.name_gu if self.category else '',
            'image': self.image,
            'stock': self.stock,
            'unit': self.unit,
            'price_per_kg': self.price_per_kg,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'prices': [p.to_dict() for p in self.prices]
        }


class ProductPrice(db.Model):
    """Different prices for different weights/quantities"""
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    weight = db.Column(db.Float, nullable=False)  # Weight in grams or quantity
    weight_unit = db.Column(db.String(10), default='g')  # g, kg, piece
    price = db.Column(db.Float, nullable=False)
    mrp = db.Column(db.Float)  # Maximum Retail Price (optional)
    is_default = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'weight': self.weight,
            'weight_unit': self.weight_unit,
            'price': self.price,
            'mrp': self.mrp,
            'is_default': self.is_default,
            'display_text': f"{self.weight}{self.weight_unit} - ₹{self.price}"
        }


class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), unique=True)
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='customer', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'total_orders': len(self.orders)
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'))
    customer_name = db.Column(db.String(100))
    customer_phone = db.Column(db.String(15))
    subtotal = db.Column(db.Float, default=0)
    discount = db.Column(db.Float, default=0)
    discount_type = db.Column(db.String(10), default='amount')  # amount or percent
    tax = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(20), default='cash')  # cash, upi, card
    payment_status = db.Column(db.String(20), default='paid')  # paid, pending
    status = db.Column(db.String(20), default='completed')  # completed, pending, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'subtotal': self.subtotal,
            'discount': self.discount,
            'discount_type': self.discount_type,
            'tax': self.tax,
            'total': self.total,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.strftime('%d/%m/%Y %H:%M'),
            'items': [item.to_dict() for item in self.items]
        }


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    product_name = db.Column(db.String(100))
    product_name_gu = db.Column(db.String(100))
    weight = db.Column(db.Float)
    weight_unit = db.Column(db.String(10))
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float)
    total = db.Column(db.Float)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_name_gu': self.product_name_gu,
            'weight': self.weight,
            'weight_unit': self.weight_unit,
            'quantity': self.quantity,
            'price': self.price,
            'total': self.total
        }


class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Text)

    @staticmethod
    def get(key, default=None):
        setting = Settings.query.filter_by(key=key).first()
        return setting.value if setting else default

    @staticmethod
    def set(key, value):
        setting = Settings.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            setting = Settings(key=key, value=value)
            db.session.add(setting)
        db.session.commit()


# ==================== HELPER FUNCTIONS ====================

def generate_order_number():
    """Generate unique order number: SM + date + sequence"""
    today = datetime.now().strftime('%Y%m%d')
    prefix = f"SM{today}"
    last_order = Order.query.filter(Order.order_number.like(f"{prefix}%")).order_by(Order.id.desc()).first()
    if last_order:
        last_seq = int(last_order.order_number[-4:])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


# ==================== PAGE ROUTES ====================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin/index.html')

@app.route('/admin/products')
def admin_products():
    return render_template('admin/products.html')

@app.route('/admin/categories')
def admin_categories():
    return render_template('admin/categories.html')

@app.route('/admin/orders')
def admin_orders():
    return render_template('admin/orders.html')

@app.route('/admin/customers')
def admin_customers():
    return render_template('admin/customers.html')

@app.route('/admin/settings')
def admin_settings():
    return render_template('admin/settings.html')

@app.route('/pos')
def pos():
    """Point of Sale / Billing Interface"""
    return render_template('pos.html')


# ==================== API ROUTES ====================

# ----- Dashboard Stats -----
@app.route('/api/dashboard/stats')
def dashboard_stats():
    total_orders = Order.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total)).filter(Order.status != 'cancelled').scalar() or 0
    total_products = Product.query.count()
    low_stock = Product.query.filter(Product.stock < 50).count()
    
    # Recent orders
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
    
    # Order status counts
    pending = Order.query.filter_by(status='pending').count()
    completed = Order.query.filter_by(status='completed').count()
    cancelled = Order.query.filter_by(status='cancelled').count()
    
    return jsonify({
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'total_products': total_products,
        'low_stock': low_stock,
        'recent_orders': [o.to_dict() for o in recent_orders],
        'status_counts': {
            'pending': pending,
            'completed': completed,
            'cancelled': cancelled
        }
    })


# ----- Category API -----
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.order_by(Category.display_order).all()
    return jsonify([c.to_dict() for c in categories])

@app.route('/api/categories', methods=['POST'])
def create_category():
    data = request.json
    category = Category(
        name_en=data.get('name_en'),
        name_gu=data.get('name_gu'),
        description_en=data.get('description_en'),
        description_gu=data.get('description_gu'),
        image=data.get('image'),
        display_order=data.get('display_order', 0),
        is_active=data.get('is_active', True)
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

@app.route('/api/categories/<int:id>', methods=['GET'])
def get_category(id):
    category = Category.query.get_or_404(id)
    return jsonify(category.to_dict())

@app.route('/api/categories/<int:id>', methods=['PUT'])
def update_category(id):
    category = Category.query.get_or_404(id)
    data = request.json
    category.name_en = data.get('name_en', category.name_en)
    category.name_gu = data.get('name_gu', category.name_gu)
    category.description_en = data.get('description_en', category.description_en)
    category.description_gu = data.get('description_gu', category.description_gu)
    category.image = data.get('image', category.image)
    category.display_order = data.get('display_order', category.display_order)
    category.is_active = data.get('is_active', category.is_active)
    db.session.commit()
    return jsonify(category.to_dict())

@app.route('/api/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted'})


# ----- Product API -----
@app.route('/api/products', methods=['GET'])
def get_products():
    category_id = request.args.get('category_id')
    active_only = request.args.get('active', 'false').lower() == 'true'
    
    query = Product.query
    if category_id:
        query = query.filter_by(category_id=category_id)
    if active_only:
        query = query.filter_by(is_active=True)
    
    products = query.order_by(Product.name_en).all()
    return jsonify([p.to_dict() for p in products])

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    product = Product(
        name_en=data.get('name_en'),
        name_gu=data.get('name_gu'),
        description_en=data.get('description_en'),
        description_gu=data.get('description_gu'),
        category_id=data.get('category_id'),
        image=data.get('image'),
        stock=data.get('stock', 0),
        unit=data.get('unit', 'kg'),
        price_per_kg=data.get('price_per_kg'),
        is_active=data.get('is_active', True),
        is_featured=data.get('is_featured', False)
    )
    db.session.add(product)
    db.session.flush()
    
    # Add prices
    for price_data in data.get('prices', []):
        price = ProductPrice(
            product_id=product.id,
            weight=price_data.get('weight'),
            weight_unit=price_data.get('weight_unit', 'g'),
            price=price_data.get('price'),
            mrp=price_data.get('mrp'),
            is_default=price_data.get('is_default', False)
        )
        db.session.add(price)
    
    db.session.commit()
    return jsonify(product.to_dict()), 201

@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict())

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    product = Product.query.get_or_404(id)
    data = request.json
    
    product.name_en = data.get('name_en', product.name_en)
    product.name_gu = data.get('name_gu', product.name_gu)
    product.description_en = data.get('description_en', product.description_en)
    product.description_gu = data.get('description_gu', product.description_gu)
    product.category_id = data.get('category_id', product.category_id)
    product.image = data.get('image', product.image)
    product.stock = data.get('stock', product.stock)
    product.unit = data.get('unit', product.unit)
    product.price_per_kg = data.get('price_per_kg', product.price_per_kg)
    product.is_active = data.get('is_active', product.is_active)
    product.is_featured = data.get('is_featured', product.is_featured)
    
    # Update prices
    if 'prices' in data:
        # Remove old prices
        ProductPrice.query.filter_by(product_id=product.id).delete()
        # Add new prices
        for price_data in data.get('prices', []):
            price = ProductPrice(
                product_id=product.id,
                weight=price_data.get('weight'),
                weight_unit=price_data.get('weight_unit', 'g'),
                price=price_data.get('price'),
                mrp=price_data.get('mrp'),
                is_default=price_data.get('is_default', False)
            )
            db.session.add(price)
    
    db.session.commit()
    return jsonify(product.to_dict())

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted'})


# ----- Image Upload API -----
@app.route('/api/upload', methods=['POST'])
def upload_image():
    """Upload an image file and return the URL"""
    if 'file' not in request.files:
        # Check for base64 data
        data = request.json
        if data and 'image_data' in data:
            try:
                # Handle base64 image data
                image_data = data['image_data']
                if ',' in image_data:
                    # Remove data:image/png;base64, prefix
                    header, image_data = image_data.split(',', 1)
                    # Get extension from header
                    if 'png' in header:
                        ext = 'png'
                    elif 'gif' in header:
                        ext = 'gif'
                    elif 'webp' in header:
                        ext = 'webp'
                    else:
                        ext = 'jpg'
                else:
                    ext = 'jpg'
                
                # Decode and save
                image_bytes = base64.b64decode(image_data)
                filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                with open(filepath, 'wb') as f:
                    f.write(image_bytes)
                
                return jsonify({
                    'success': True,
                    'url': f'/static/uploads/{filename}',
                    'filename': filename
                })
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)}), 400
        
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'url': f'/static/uploads/{filename}',
            'filename': filename
        })
    
    return jsonify({'success': False, 'error': 'File type not allowed'}), 400


@app.route('/api/upload/<filename>', methods=['DELETE'])
def delete_uploaded_image(filename):
    """Delete an uploaded image"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'success': True, 'message': 'Image deleted'})
        return jsonify({'success': False, 'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ----- Customer API -----
@app.route('/api/customers', methods=['GET'])
def get_customers():
    search = request.args.get('search', '')
    query = Customer.query
    if search:
        query = query.filter(
            (Customer.name.ilike(f'%{search}%')) | 
            (Customer.phone.ilike(f'%{search}%'))
        )
    customers = query.order_by(Customer.name).all()
    return jsonify([c.to_dict() for c in customers])

@app.route('/api/customers', methods=['POST'])
def create_customer():
    data = request.json
    customer = Customer(
        name=data.get('name'),
        phone=data.get('phone'),
        email=data.get('email'),
        address=data.get('address')
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@app.route('/api/customers/<int:id>', methods=['GET'])
def get_customer(id):
    customer = Customer.query.get_or_404(id)
    return jsonify(customer.to_dict())

@app.route('/api/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    customer = Customer.query.get_or_404(id)
    data = request.json
    customer.name = data.get('name', customer.name)
    customer.phone = data.get('phone', customer.phone)
    customer.email = data.get('email', customer.email)
    customer.address = data.get('address', customer.address)
    db.session.commit()
    return jsonify(customer.to_dict())

@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    customer = Customer.query.get_or_404(id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Customer deleted'})


# ----- Order API -----
@app.route('/api/orders', methods=['GET'])
def get_orders():
    status = request.args.get('status')
    date_from = request.args.get('from')
    date_to = request.args.get('to')
    
    query = Order.query
    if status and status != 'all':
        query = query.filter_by(status=status)
    if date_from:
        query = query.filter(Order.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
    if date_to:
        query = query.filter(Order.created_at <= datetime.strptime(date_to, '%Y-%m-%d'))
    
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    
    order = Order(
        order_number=generate_order_number(),
        customer_id=data.get('customer_id'),
        customer_name=data.get('customer_name'),
        customer_phone=data.get('customer_phone'),
        subtotal=data.get('subtotal', 0),
        discount=data.get('discount', 0),
        discount_type=data.get('discount_type', 'amount'),
        tax=data.get('tax', 0),
        total=data.get('total', 0),
        payment_method=data.get('payment_method', 'cash'),
        payment_status=data.get('payment_status', 'paid'),
        status=data.get('status', 'completed'),
        notes=data.get('notes')
    )
    db.session.add(order)
    db.session.flush()
    
    # Add order items
    for item_data in data.get('items', []):
        product = Product.query.get(item_data.get('product_id'))
        price = item_data.get('price')
        total = item_data.get('total')
        weight = item_data.get('weight')
        weight_unit = item_data.get('weight_unit')
        quantity = item_data.get('quantity', 1)
        # Weight-based calculation
        if product and product.unit in ['kg', 'g'] and product.price_per_kg:
            if weight_unit == 'kg':
                total = product.price_per_kg * (weight or 1)
                price = product.price_per_kg
            elif weight_unit == 'g':
                total = product.price_per_kg * ((weight or 1) / 1000)
                price = product.price_per_kg / 1000
        # Piece-based calculation (unchanged)
        item = OrderItem(
            order_id=order.id,
            product_id=item_data.get('product_id'),
            product_name=item_data.get('product_name'),
            product_name_gu=item_data.get('product_name_gu'),
            weight=weight,
            weight_unit=weight_unit,
            quantity=quantity,
            price=price,
            total=total
        )
        db.session.add(item)
        # Update stock
        if product:
            if product.unit in ['kg', 'g']:
                product.stock = max(0, product.stock - (weight or 1))
            else:
                product.stock = max(0, product.stock - quantity)
    
    db.session.commit()
    return jsonify(order.to_dict()), 201

@app.route('/api/orders/<int:id>', methods=['GET'])
def get_order(id):
    order = Order.query.get_or_404(id)
    return jsonify(order.to_dict())

@app.route('/api/orders/<int:id>', methods=['PUT'])
def update_order(id):
    order = Order.query.get_or_404(id)
    data = request.json
    order.status = data.get('status', order.status)
    order.payment_status = data.get('payment_status', order.payment_status)
    order.notes = data.get('notes', order.notes)
    db.session.commit()
    return jsonify(order.to_dict())

@app.route('/api/orders/<int:id>', methods=['DELETE'])
def delete_order(id):
    order = Order.query.get_or_404(id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({'message': 'Order deleted'})


# ----- Settings API -----
@app.route('/api/settings', methods=['GET'])
def get_settings():
    settings = Settings.query.all()
    return jsonify({s.key: s.value for s in settings})

@app.route('/api/settings', methods=['POST'])
def save_settings():
    data = request.json
    for key, value in data.items():
        Settings.set(key, value)
    return jsonify({'message': 'Settings saved'})


# ----- Print API -----
@app.route('/api/print/receipt/<int:order_id>')
def print_receipt(order_id):
    """Generate receipt data for printing"""
    order = Order.query.get_or_404(order_id)
    
    # Get shop settings
    shop_name = Settings.get('shop_name', 'Sant Masala')
    shop_name_gu = Settings.get('shop_name_gu', 'સંત મસાલા')
    shop_address = Settings.get('shop_address', '')
    shop_phone = Settings.get('shop_phone', '')
    shop_gst = Settings.get('shop_gst', '')
    
    receipt_data = {
        'shop': {
            'name': shop_name,
            'name_gu': shop_name_gu,
            'address': shop_address,
            'phone': shop_phone,
            'gst': shop_gst
        },
        'order': order.to_dict(),
        'print_time': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    }
    
    return jsonify(receipt_data)


# ==================== Initialize Database ====================

def init_db():
    """Initialize database with sample data"""
    with app.app_context():
        db.create_all()
        
        # Add default settings
        if not Settings.query.first():
            default_settings = {
                'shop_name': 'Sant Masala',
                'shop_name_gu': 'સંત મસાલા',
                'shop_address': 'Main Market, Bhavnagar - 364001',
                'shop_phone': '+91 98765 43210',
                'shop_gst': '',
                'currency': '₹',
                'tax_rate': '0',
                'printer_type': 'usb',
                'printer_width': '58',
                'language': 'en'
            }
            for key, value in default_settings.items():
                Settings.set(key, value)
        
        # Add sample categories if none exist
        if not Category.query.first():
            categories = [
                {'name_en': 'Blended Spices', 'name_gu': 'મિશ્રિત મસાલા', 'description_en': 'Premium blended spice mixes', 'display_order': 1},
                {'name_en': 'Chilli Powder', 'name_gu': 'મરચાં પાવડર', 'description_en': 'Pure and spicy chilli powder', 'display_order': 2},
                {'name_en': 'Turmeric', 'name_gu': 'હળદર', 'description_en': 'Natural turmeric powder', 'display_order': 3},
                {'name_en': 'Asafoetida', 'name_gu': 'હિંગ', 'description_en': 'Premium quality asafoetida', 'display_order': 4},
                {'name_en': 'Whole Spices', 'name_gu': 'સંપૂર્ણ મસાલા', 'description_en': 'Fresh whole spices', 'display_order': 5},
                {'name_en': 'Dry Fruits', 'name_gu': 'સૂકા મેવા', 'description_en': 'Premium dry fruits and nuts', 'display_order': 6},
            ]
            for cat_data in categories:
                cat = Category(**cat_data)
                db.session.add(cat)
            db.session.commit()
        
        # Add sample products if none exist
        if not Product.query.first():
            products = [
                {
                    'name_en': 'Garam Masala', 'name_gu': 'ગરમ મસાલો', 
                    'category_id': 1, 'stock': 498,
                    'prices': [
                        {'weight': 50, 'weight_unit': 'g', 'price': 30},
                        {'weight': 100, 'weight_unit': 'g', 'price': 55, 'is_default': True},
                        {'weight': 250, 'weight_unit': 'g', 'price': 130},
                        {'weight': 500, 'weight_unit': 'g', 'price': 250},
                        {'weight': 1, 'weight_unit': 'kg', 'price': 480},
                    ]
                },
                {
                    'name_en': 'Chana Masala', 'name_gu': 'ચણા મસાલો', 
                    'category_id': 1, 'stock': 698,
                    'prices': [
                        {'weight': 50, 'weight_unit': 'g', 'price': 20},
                        {'weight': 100, 'weight_unit': 'g', 'price': 38, 'is_default': True},
                        {'weight': 250, 'weight_unit': 'g', 'price': 90},
                        {'weight': 500, 'weight_unit': 'g', 'price': 175},
                    ]
                },
                {
                    'name_en': 'Pav Bhaji Masala', 'name_gu': 'પાવ ભાજી મસાલો', 
                    'category_id': 1, 'stock': 400,
                    'prices': [
                        {'weight': 50, 'weight_unit': 'g', 'price': 22},
                        {'weight': 100, 'weight_unit': 'g', 'price': 42, 'is_default': True},
                        {'weight': 250, 'weight_unit': 'g', 'price': 100},
                    ]
                },
                {
                    'name_en': 'Turmeric Powder', 'name_gu': 'હળદર પાવડર', 
                    'category_id': 3, 'stock': 700,
                    'prices': [
                        {'weight': 100, 'weight_unit': 'g', 'price': 25},
                        {'weight': 250, 'weight_unit': 'g', 'price': 58, 'is_default': True},
                        {'weight': 500, 'weight_unit': 'g', 'price': 110},
                        {'weight': 1, 'weight_unit': 'kg', 'price': 210},
                    ]
                },
                {
                    'name_en': 'Hing Powder', 'name_gu': 'હિંગ પાવડર', 
                    'category_id': 4, 'stock': 196,
                    'prices': [
                        {'weight': 10, 'weight_unit': 'g', 'price': 45},
                        {'weight': 25, 'weight_unit': 'g', 'price': 100, 'is_default': True},
                        {'weight': 50, 'weight_unit': 'g', 'price': 190},
                        {'weight': 100, 'weight_unit': 'g', 'price': 360},
                    ]
                },
                {
                    'name_en': 'Coriander Seeds', 'name_gu': 'ધાણા', 
                    'category_id': 5, 'stock': 449,
                    'prices': [
                        {'weight': 100, 'weight_unit': 'g', 'price': 22},
                        {'weight': 250, 'weight_unit': 'g', 'price': 52, 'is_default': True},
                        {'weight': 500, 'weight_unit': 'g', 'price': 98},
                        {'weight': 1, 'weight_unit': 'kg', 'price': 185},
                    ]
                },
                {
                    'name_en': 'Cumin Seeds', 'name_gu': 'જીરું', 
                    'category_id': 5, 'stock': 399,
                    'prices': [
                        {'weight': 100, 'weight_unit': 'g', 'price': 35},
                        {'weight': 250, 'weight_unit': 'g', 'price': 82, 'is_default': True},
                        {'weight': 500, 'weight_unit': 'g', 'price': 155},
                        {'weight': 1, 'weight_unit': 'kg', 'price': 300},
                    ]
                },
            ]
            
            for prod_data in products:
                prices = prod_data.pop('prices')
                product = Product(**prod_data)
                db.session.add(product)
                db.session.flush()
                
                for price_data in prices:
                    price = ProductPrice(product_id=product.id, **price_data)
                    db.session.add(price)
            
            db.session.commit()
        
        print("Database initialized successfully!")


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
