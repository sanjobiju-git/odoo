import uuid
from decimal import Decimal
from datetime import date
from django.db import models, transaction
from django.db.models import F
from apps.products.models import Product

class DiscountRule(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage'
        FIXED = 'FIXED', 'Fixed Amount'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EXHAUSTED = 'EXHAUSTED', 'Exhausted'
        EXPIRED = 'EXPIRED', 'Expired'
        INACTIVE = 'INACTIVE', 'Inactive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, db_index=True)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    discount_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="% or fixed amount")
    min_purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    min_quantity = models.PositiveIntegerField(default=1)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    max_usage_count = models.PositiveIntegerField(null=True, blank=True, help_text="Null or 0 for unlimited")
    current_usage_count = models.PositiveIntegerField(default=0)
    applicable_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='discounts')
    is_subscription_wide = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def is_eligible(self, subtotal: Decimal, quantity: int = 1, product=None, target_date=None) -> tuple[bool, str]:
        """Check whether discount rule is currently eligible for an order."""
        check_date = target_date or date.today()

        if self.status != self.Status.ACTIVE:
            return False, f"Discount {self.code} is not active."
        if self.start_date and check_date < self.start_date:
            return False, f"Discount {self.code} is not yet active."
        if self.end_date and check_date > self.end_date:
            return False, f"Discount {self.code} has expired."
        if self.max_usage_count and self.current_usage_count >= self.max_usage_count:
            return False, f"Discount {self.code} usage limit has been reached."
        if subtotal < self.min_purchase_amount:
            return False, f"Order subtotal must be at least ${self.min_purchase_amount}."
        if quantity < self.min_quantity:
            return False, f"Minimum quantity requirement of {self.min_quantity} not met."
        if self.applicable_product and product and self.applicable_product != product:
            return False, f"Discount is only valid for product {self.applicable_product.name}."

        return True, "Eligible"

    def calculate_discount(self, subtotal: Decimal) -> Decimal:
        """Calculate discount amount in Decimal precision."""
        if self.discount_type == self.DiscountType.PERCENTAGE:
            discount = (subtotal * self.discount_value) / Decimal('100.00')
            return min(round(discount, 2), subtotal)
        elif self.discount_type == self.DiscountType.FIXED:
            return min(round(self.discount_value, 2), subtotal)
        return Decimal('0.00')

    @classmethod
    def apply_and_increment_usage(cls, rule_id: uuid.UUID) -> bool:
        """Atomic race-condition safe increment of discount usage count."""
        with transaction.atomic():
            rule = cls.objects.select_for_update().get(id=rule_id)
            if rule.max_usage_count and rule.current_usage_count >= rule.max_usage_count:
                return False
            rule.current_usage_count += 1
            if rule.max_usage_count and rule.current_usage_count >= rule.max_usage_count:
                rule.status = cls.Status.EXHAUSTED
            rule.save(update_fields=['current_usage_count', 'status', 'updated_at'])
            return True

    def __str__(self):
        return f"{self.name} [{self.code}] ({self.discount_value})"

class DiscountUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    discount_rule = models.ForeignKey(DiscountRule, on_delete=models.CASCADE, related_name='usages')
    customer_id = models.UUIDField(null=True, blank=True)
    applied_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-used_at']
