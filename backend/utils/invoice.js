const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export const buildInvoiceNumber = (order) => {
  const suffix = String(order._id).slice(-8).toUpperCase();
  return `INV-${suffix}`;
};

export const buildInvoiceHtml = (order) => {
  const invoiceNo = order.invoiceNumber || buildInvoiceNumber(order);
  const orderNo = String(order._id).slice(-8).toUpperCase();
  const customerName = order.user?.name || order.guestEmail || "Guest";
  const shipping = order.shippingAddress || {};
  const itemsRows = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price * item.qty)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Invoice ${invoiceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; color:#222; margin:0; padding:24px; }
        .card { max-width: 860px; margin: 0 auto; border:1px solid #eee; border-radius:16px; padding:24px; }
        .row { display:flex; justify-content:space-between; gap:16px; }
        .muted { color:#666; font-size:12px; }
        table { width:100%; border-collapse:collapse; margin-top:18px; }
        th { text-align:left; font-size:12px; color:#666; border-bottom:2px solid #eee; padding-bottom:8px; }
        td { font-size:14px; vertical-align:top; }
        .totals { margin-top:18px; margin-left:auto; width:280px; }
        .totals div { display:flex; justify-content:space-between; padding:6px 0; }
        .grand { font-weight:bold; font-size:16px; border-top:1px solid #eee; margin-top:8px; padding-top:8px; }
        @media print { body { padding: 0; } .card { border: none; border-radius: 0; } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="row">
          <div>
            <h1 style="margin:0;font-size:28px;">Rakhi - Thread of Love</h1>
            <p class="muted" style="margin:6px 0 0;">Invoice ${invoiceNo}</p>
          </div>
          <div style="text-align:right;">
            <div class="muted">Order #${orderNo}</div>
            <div class="muted">${new Date(order.createdAt).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div class="row" style="margin-top:24px;">
          <div>
            <div class="muted">Bill To</div>
            <div style="font-weight:bold;margin-top:4px;">${customerName}</div>
            <div>${shipping.line1 || ""}${shipping.line2 ? `, ${shipping.line2}` : ""}</div>
            <div>${shipping.city || ""}, ${shipping.state || ""} - ${shipping.pincode || ""}</div>
            <div>${shipping.phone || ""}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted">Payment</div>
            <div style="font-weight:bold;margin-top:4px;">${String(order.paymentMethod || "cod").toUpperCase()}</div>
            <div class="muted">Status: ${String(order.status || "pending")}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="width:70px;text-align:center;">Qty</th>
              <th style="width:120px;text-align:right;">Rate</th>
              <th style="width:140px;text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>

        <div class="totals">
          <div><span>Items Total</span><span>${formatCurrency(order.itemsPrice)}</span></div>
          <div><span>Shipping</span><span>${formatCurrency(order.shippingPrice)}</span></div>
          <div class="grand"><span>Total</span><span>${formatCurrency(order.totalPrice)}</span></div>
        </div>
      </div>
    </body>
  </html>`;
};

