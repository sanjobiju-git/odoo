from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from datetime import date
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Invoice Management API:
    - Staff & Admin: View, issue, confirm, and void invoices.
    - Customer: View and download their own invoices.
    """
    queryset = Invoice.objects.select_related('customer', 'subscription').prefetch_related('lines__product').all()
    serializer_class = InvoiceSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.select_related('customer', 'subscription').prefetch_related('lines__product').all()
        if user.is_customer:
            return qs.filter(customer__user=user)

        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        is_overdue = self.request.query_params.get('is_overdue')
        if is_overdue == 'true':
            qs = qs.filter(due_date__lt=date.today(), balance_due__gt=0).exclude(status__in=['PAID', 'CANCELLED'])
        return qs

    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != Invoice.Status.DRAFT:
            return Response({"error": f"Cannot confirm invoice from {invoice.status} status."}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = Invoice.Status.CONFIRMED
        invoice.save(update_fields=['status', 'updated_at'])
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.Status.PAID:
            return Response({"error": "Cannot cancel a paid invoice. Please process a refund or credit note."}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = Invoice.Status.CANCELLED
        invoice.save(update_fields=['status', 'updated_at'])
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        """Render a clean, print-ready, professional HTML/PDF representation of the invoice."""
        invoice = self.get_object()
        html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice {invoice.invoice_number}</title>
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }}
.header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }}
.logo {{ font-size: 24px; font-weight: 800; color: #4338ca; }}
.meta {{ text-align: right; font-size: 14px; color: #64748b; }}
.parties {{ display: flex; justify-content: space-between; margin-top: 30px; font-size: 14px; }}
.box {{ width: 45%; }}
.table {{ width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 14px; }}
.table th {{ background: #f8fafc; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; }}
.table td {{ padding: 12px; border-bottom: 1px solid #e2e8f0; }}
.totals {{ margin-top: 20px; float: right; width: 320px; font-size: 14px; }}
.totals tr td:last-child {{ text-align: right; font-weight: 600; }}
.badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; }}
.badge-paid {{ background: #dcfce7; color: #15803d; }}
.badge-confirmed {{ background: #dbeafe; color: #1d4ed8; }}
.badge-draft {{ background: #f1f5f9; color: #475569; }}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">SUBSIGHT</div>
    <div style="font-size: 13px; color: #64748b;">Brightloop Software, Inc.</div>
    <div style="font-size: 12px; color: #94a3b8;">billing@brightloop.com</div>
  </div>
  <div class="meta">
    <h2 style="margin: 0 0 8px 0; color: #0f172a;">INVOICE</h2>
    <div><strong>Invoice #:</strong> {invoice.invoice_number}</div>
    <div><strong>Date:</strong> {invoice.invoice_date}</div>
    <div><strong>Due Date:</strong> {invoice.due_date}</div>
    <div style="margin-top: 6px;">Status: <span class="badge badge-{'paid' if invoice.status == 'PAID' else 'confirmed'}">{invoice.status}</span></div>
  </div>
</div>
<div class="parties">
  <div class="box">
    <strong>Billed To:</strong><br>
    {invoice.customer_name_snapshot}<br>
    {invoice.customer_email_snapshot}<br>
    {invoice.billing_address_snapshot or 'No address on file'}
  </div>
  <div class="box" style="text-align: right;">
    <strong>Subscription Reference:</strong><br>
    {invoice.subscription.subscription_number if invoice.subscription else 'One-time Bill'}<br>
    Period: {invoice.billing_period_start or 'N/A'} to {invoice.billing_period_end or 'N/A'}
  </div>
</div>
<table class="table">
  <thead>
    <tr>
      <th>Description</th>
      <th style="text-align: center;">Qty</th>
      <th style="text-align: right;">Unit Price</th>
      <th style="text-align: right;">Discount</th>
      <th style="text-align: right;">Tax</th>
      <th style="text-align: right;">Total</th>
    </tr>
  </thead>
  <tbody>
"""
        for line in invoice.lines.all():
            html += f"""
    <tr>
      <td>{line.description}</td>
      <td style="text-align: center;">{line.quantity}</td>
      <td style="text-align: right;">${line.unit_price}</td>
      <td style="text-align: right;">${line.discount_amount}</td>
      <td style="text-align: right;">${line.tax_amount} ({line.tax_name_snapshot or 'None'})</td>
      <td style="text-align: right;">${line.total_amount}</td>
    </tr>"""

        html += f"""
  </tbody>
</table>
<div class="totals">
  <table style="width: 100%;">
    <tr><td>Subtotal:</td><td>${invoice.subtotal}</td></tr>
    <tr><td>Discount Total:</td><td>-${invoice.discount_total}</td></tr>
    <tr><td>Tax Total:</td><td>+${invoice.tax_total}</td></tr>
    <tr style="border-top: 2px solid #0f172a; font-size: 16px;"><td><strong>Total:</strong></td><td><strong>${invoice.total_amount} {invoice.currency}</strong></td></tr>
    <tr><td>Amount Paid:</td><td>${invoice.amount_paid}</td></tr>
    <tr style="color: {'#dc2626' if invoice.balance_due > 0 else '#16a34a'}; font-size: 15px;"><td><strong>Balance Due:</strong></td><td><strong>${invoice.balance_due} {invoice.currency}</strong></td></tr>
  </table>
</div>
</body>
</html>"""
        response = HttpResponse(html, content_type='text/html')
        response['Content-Disposition'] = f'inline; filename="{invoice.invoice_number}.html"'
        return response
