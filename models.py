from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class User:
    id: Optional[int]
    surname: str
    name: str
    patronymic: str
    phone: str
    password: str
    avatar: str = '👤'
    balance: int = 21630
    bonus: int = 3210
    is_premium: bool = False
    created_at: Optional[datetime] = None
    
    @property
    def full_name(self):
        return f"{self.surname} {self.name} {self.patronymic}".strip()
    
    def to_dict(self):
        return {
            'id': self.id,
            'surname': self.surname,
            'name': self.name,
            'patronymic': self.patronymic,
            'phone': self.phone,
            'avatar': self.avatar,
            'balance': self.balance,
            'bonus': self.bonus,
            'is_premium': self.is_premium
        }

@dataclass
class OrderItem:
    product_name: str
    quantity: int
    price_per_item: int
    product_icon: str = ''
    is_bonus: bool = False
    addons: List[str] = None
    
    @property
    def total_price(self):
        return self.quantity * self.price_per_item

@dataclass
class Order:
    id: Optional[int]
    user_id: int
    order_number: str
    items: List[OrderItem]
    total_amount: int
    delivery_address: str
    delivery_type: str = 'standard'
    tip_amount: int = 0
    bonus_used: int = 0
    payment_method: str = 'card'
    cashback_earned: int = 0
    status: str = 'В пути'
    rating: Optional[int] = None
    review_text: str = ''
    created_at: Optional[datetime] = None
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'total_amount': self.total_amount,
            'delivery_address': self.delivery_address,
            'delivery_type': self.delivery_type,
            'tip_amount': self.tip_amount,
            'status': self.status,
            'rating': self.rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [{
                'product_name': item.product_name,
                'quantity': item.quantity,
                'price': item.price_per_item,
                'total': item.total_price,
                'is_bonus': item.is_bonus
            } for item in self.items]
        }

@dataclass
class Promocode:
    id: int
    code: str
    discount_type: str  # 'percent', 'fixed', 'cashback'
    discount_value: int
    max_uses: Optional[int]
    used_count: int = 0
    expires_at: Optional[datetime] = None
    is_active: bool = True
    
    def is_valid(self):
        if not self.is_active:
            return False
        if self.max_uses and self.used_count >= self.max_uses:
            return False
        if self.expires_at and self.expires_at < datetime.now():
            return False
        return True
    
    def calculate_discount(self, amount):
        if self.discount_type == 'percent':
            return amount * self.discount_value // 100
        elif self.discount_type == 'fixed':
            return min(self.discount_value, amount)
        return 0