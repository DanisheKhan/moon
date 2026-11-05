import { formatDate } from '@/shared/lib/format';

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stringCell(value) {
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function numberCell(value) {
  const n = typeof value === 'number' ? value : parseFloat(value || '0');
  const safe = Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  return `<Cell ss:StyleID="Number"><Data ss:Type="Number">${safe}</Data></Cell>`;
}

function headerCell(label) {
  return `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(label)}</Data></Cell>`;
}

function invoicePaidAmount(invoice) {
  return (invoice.payments || []).reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
}

function paymentMethods(invoice) {
  const methods = (invoice.payments || [])
    .map((payment) => payment.payment_method)
    .filter(Boolean);
  return [...new Set(methods)].join(', ') || '—';
}

function itemsSummary(invoice) {
  return (invoice.order_items || [])
    .map((item) => `${item.item_name || 'Item'} × ${item.quantity || 1}`)
    .join('; ');
}

function buildRowsXml(headers, rows) {
  const headerRow = `<Row>${headers.map(headerCell).join('')}</Row>`;
  const dataRows = rows
    .map((cells) => `<Row>${cells.join('')}</Row>`)
    .join('');
  return `${headerRow}${dataRows}`;
}

/**
 * Downloads the currently visible invoice list as an Excel workbook (.xls SpreadsheetML).
 * Sheet 1 is one row per bill; sheet 2 expands line items for audit.
 * @param {Array<Object>} invoices
 */
export function downloadBillingHistoryExcel(invoices = []) {
  const generatedOn = formatDate(new Date());
  const stamp = new Date().toISOString().slice(0, 10);

  const billHeaders = [
    'Invoice Number',
    'Date',
    'Store',
    'Customer Name',
    'Phone',
    'Customer GSTIN',
    'Items',
    'Subtotal (INR)',
    'Discount (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'Grand Total (INR)',
    'Amount Paid (INR)',
    'Balance Due (INR)',
    'Payment Methods',
    'Status',
  ];

  const billRows = invoices.map((invoice) => {
    const paid = invoicePaidAmount(invoice);
    const grand = parseFloat(invoice.grand_total) || 0;
    return [
      stringCell(invoice.invoice_number || ''),
      stringCell(invoice.created_at ? formatDate(invoice.created_at) : ''),
      stringCell(invoice.stores?.name || ''),
      stringCell(invoice.customer_name || 'Walk-in Customer'),
      stringCell(invoice.customer_phone || ''),
      stringCell(invoice.customer_gstin || ''),
      stringCell(itemsSummary(invoice)),
      numberCell(invoice.subtotal),
      numberCell(invoice.discount_amount),
      numberCell(invoice.cgst_amount),
      numberCell(invoice.sgst_amount),
      numberCell(grand),
      numberCell(paid),
      numberCell(Math.max(grand - paid, 0)),
      stringCell(paymentMethods(invoice)),
      stringCell((invoice.status || '').replace(/_/g, ' ')),
    ];
  });

  const itemHeaders = [
    'Invoice Number',
    'Date',
    'Store',
    'Customer Name',
    'Item',
    'Serial / IMEI',
    'Quantity',
    'Unit Price (INR)',
    'Discount (INR)',
    'Line Total (INR)',
    'GST Rate (%)',
  ];

  const itemRows = invoices.flatMap((invoice) => {
    const lines = invoice.order_items || [];
    return lines.map((item) => [
      stringCell(invoice.invoice_number || ''),
      stringCell(invoice.created_at ? formatDate(invoice.created_at) : ''),
      stringCell(invoice.stores?.name || ''),
      stringCell(invoice.customer_name || 'Walk-in Customer'),
      stringCell(item.item_name || ''),
      stringCell(item.serial_number || ''),
      numberCell(item.quantity ?? ''),
      numberCell(item.unit_price ?? ''),
      numberCell(item.discount ?? ''),
      numberCell(item.total_amount ?? ''),
      numberCell(item.gst_rate ?? ''),
    ]);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>Star Enterprises Billing History</Title>
    <Author>Star Enterprises Owner Portal</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/><!-- banned-ok: excel xml attribute -->
      <Interior ss:Color="#171717" ss:Pattern="Solid"/><!-- banned-ok: excel xml attribute -->
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    </Style>
    <Style ss:ID="Number">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Bills">
    <Table>
      <Row>
        <Cell ss:MergeAcross="${billHeaders.length - 1}"><Data ss:Type="String">Star Enterprises — Billing History (generated ${xmlEscape(generatedOn)})</Data></Cell>
      </Row>
      ${buildRowsXml(billHeaders, billRows)}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Line Items">
    <Table>
      <Row>
        <Cell ss:MergeAcross="${itemHeaders.length - 1}"><Data ss:Type="String">Line-item detail for the same filtered bills</Data></Cell>
      </Row>
      ${buildRowsXml(itemHeaders, itemRows)}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob(['\uFEFF', xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Star_Enterprises_Billing_History_${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
