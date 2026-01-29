const Reports = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Stock Reports</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Stock Summary</li>
            <li>• Batch-wise Stock</li>
            <li>• Expiry Report</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Sales Reports</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Sales Register</li>
            <li>• Item-wise Sales</li>
            <li>• Profit & Margin</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">GST Reports</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• GSTR-1</li>
            <li>• GSTR-3B</li>
            <li>• HSN Summary</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;
