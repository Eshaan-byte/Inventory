import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const Billing = () => {
  const { user } = useAuthStore();
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    medicine: null,
    batch: null,
    quantity: 1,
    rate: 0,
    discount: 0,
  });
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineResults, setMedicineResults] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const medicineInputRef = useRef(null);
  const quantityInputRef = useRef(null);

  useEffect(() => {
    generateInvoiceNumber();
    medicineInputRef.current?.focus();

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'F9' && !e.repeat) {
        e.preventDefault();
        handleSaveBill();
      } else if (e.key === 'Escape') {
        handleClearBill();
      } else if (e.key === 'F12') {
        e.preventDefault();
        medicineInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, customer]);

  const generateInvoiceNumber = async () => {
    try {
      const response = await api.sales.generateInvoiceNo();
      setInvoiceNo(response.data.invoice_no);
    } catch (error) {
      console.error('Failed to generate invoice number:', error);
    }
  };

  const searchMedicines = async (query) => {
    if (!query || query.length < 2) {
      setMedicineResults([]);
      return;
    }

    try {
      const response = await api.medicines.search(query);
      setMedicineResults(response.data);
    } catch (error) {
      console.error('Failed to search medicines:', error);
    }
  };

  const selectMedicine = async (medicine) => {
    setMedicineSearch(medicine.name);
    setMedicineResults([]);

    // Update current item with medicine
    setCurrentItem(prev => ({ ...prev, medicine, batch: null, rate: 0 }));

    // Load available batches
    try {
      const response = await api.batches.available(medicine.id);
      setBatchOptions(response.data);

      // Auto-select first batch (FIFO)
      if (response.data.length > 0) {
        const firstBatch = response.data[0];
        setCurrentItem(prev => ({
          ...prev,
          medicine,
          batch: firstBatch,
          rate: firstBatch.mrp,
        }));
        // Focus on quantity input
        setTimeout(() => quantityInputRef.current?.focus(), 100);
      } else {
        alert('No batches available for this medicine. Please add stock first.');
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
      alert('Failed to load batches. Please try again.');
    }
  };

  const selectBatch = (batch) => {
    setCurrentItem(prev => ({
      ...prev,
      batch,
      rate: batch.mrp,
    }));
    quantityInputRef.current?.focus();
  };

  const addItem = () => {
    if (!currentItem.medicine || !currentItem.batch || currentItem.quantity <= 0) {
      alert('Please select medicine, batch, and quantity');
      return;
    }

    if (currentItem.quantity > currentItem.batch.quantity_in_stock) {
      alert(`Insufficient stock. Available: ${currentItem.batch.quantity_in_stock}`);
      return;
    }

    const itemTotal = currentItem.quantity * currentItem.rate;
    const discountAmount = (itemTotal * currentItem.discount) / 100;
    const netAmount = itemTotal - discountAmount;
    const gstAmount = (netAmount * currentItem.medicine.gst_percentage) / 100;
    const total = netAmount + gstAmount;

    const newItem = {
      medicine_id: currentItem.medicine.id,
      medicine_name: currentItem.medicine.name,
      manufacturer: currentItem.medicine.manufacturer,
      batch_id: currentItem.batch.id,
      batch_number: currentItem.batch.batch_number,
      expiry_date: currentItem.batch.expiry_date,
      quantity: currentItem.quantity,
      sale_rate: currentItem.rate,
      mrp: currentItem.batch.mrp,
      discount_percentage: currentItem.discount,
      gst_percentage: currentItem.medicine.gst_percentage,
      item_total: itemTotal,
      discount_amount: discountAmount,
      gst_amount: gstAmount,
      total,
    };

    setItems([...items, newItem]);

    // Reset current item
    setCurrentItem({
      medicine: null,
      batch: null,
      quantity: 1,
      rate: 0,
      discount: 0,
    });
    setMedicineSearch('');
    setBatchOptions([]);
    medicineInputRef.current?.focus();
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.item_total, 0);
    const discount = items.reduce((sum, item) => sum + item.discount_amount, 0);
    const taxable = subtotal - discount;
    const cgst = items.reduce((sum, item) => sum + item.gst_amount / 2, 0);
    const sgst = cgst;
    const total = taxable + cgst + sgst;
    const roundOff = Math.round(total) - total;
    const netPayable = Math.round(total);

    return { subtotal, discount, taxable, cgst, sgst, total, roundOff, netPayable };
  };

  const handleSaveBill = async () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);

    try {
      const invoiceData = {
        invoice_no: invoiceNo,
        invoice_date: new Date().toISOString().split('T')[0],
        customer_id: customer?.id || null,
        payment_mode: 'CASH',
        items: items.map(item => ({
          medicine_id: item.medicine_id,
          batch_id: item.batch_id,
          quantity: item.quantity,
          sale_rate: item.sale_rate,
          mrp: item.mrp,
          discount_percentage: item.discount_percentage,
          gst_percentage: item.gst_percentage,
        })),
        created_by: user?.id,
      };

      await api.sales.create(invoiceData);

      alert('Bill saved successfully!');
      handleClearBill();
      await generateInvoiceNumber();
    } catch (error) {
      alert(`Failed to save bill: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClearBill = () => {
    setItems([]);
    setCustomer(null);
    setCustomerSearch('');
    setCurrentItem({
      medicine: null,
      batch: null,
      quantity: 1,
      rate: 0,
      discount: 0,
    });
    setMedicineSearch('');
    setBatchOptions([]);
    medicineInputRef.current?.focus();
  };

  const totals = calculateTotals();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
            <p className="text-sm text-gray-600 mt-1">
              Invoice: <span className="font-mono font-bold">{invoiceNo}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearBill}
              className="btn btn-secondary"
              disabled={saving}
            >
              Clear <span className="kbd ml-2">ESC</span>
            </button>
            <button
              onClick={handleSaveBill}
              className="btn btn-success"
              disabled={saving || items.length === 0}
            >
              {saving ? 'Saving...' : 'Save Bill'} <span className="kbd ml-2">F9</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Medicine Search */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Add Item</h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Medicine Search */}
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine <span className="kbd">F12</span>
                </label>
                <input
                  ref={medicineInputRef}
                  type="text"
                  value={medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value);
                    searchMedicines(e.target.value);
                  }}
                  className="input"
                  placeholder="Search medicine..."
                  autoComplete="off"
                />

                {medicineResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {medicineResults.map((medicine) => (
                      <button
                        key={medicine.id}
                        onClick={() => selectMedicine(medicine)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-xs text-gray-500">{medicine.salt_composition}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch
                </label>
                <select
                  value={currentItem.batch?.id || ''}
                  onChange={(e) => {
                    const batch = batchOptions.find(b => b.id === parseInt(e.target.value));
                    if (batch) selectBatch(batch);
                  }}
                  className="input"
                  disabled={!currentItem.medicine}
                >
                  <option value="">Select batch</option>
                  {batchOptions.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_number} | Exp: {new Date(batch.expiry_date).toLocaleDateString()} | Stock: {batch.quantity_in_stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                  className="input"
                  disabled={!currentItem.batch}
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={currentItem.rate}
                  onChange={(e) => setCurrentItem({ ...currentItem, rate: parseFloat(e.target.value) || 0 })}
                  className="input"
                  disabled={!currentItem.batch}
                />
              </div>
            </div>

            <button
              onClick={addItem}
              className="btn btn-primary mt-4"
              disabled={!currentItem.medicine || !currentItem.batch}
            >
              Add to Bill
            </button>
          </div>

          {/* Bill Items */}
          {items.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Bill Items</h3>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-8">#</th>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>GST</th>
                      <th>Total</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="font-medium">{item.medicine_name}</div>
                          <div className="text-xs text-gray-500">{item.manufacturer}</div>
                        </td>
                        <td className="text-xs">
                          {item.batch_number}
                          <div className="text-gray-500">Exp: {new Date(item.expiry_date).toLocaleDateString()}</div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>₹{item.sale_rate.toFixed(2)}</td>
                        <td>{item.gst_percentage}%</td>
                        <td className="font-semibold">₹{item.total.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span className="text-red-600">- ₹{totals.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxable Amount:</span>
                      <span>₹{totals.taxable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CGST:</span>
                      <span>₹{totals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SGST:</span>
                      <span>₹{totals.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Round Off:</span>
                      <span>₹{totals.roundOff.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t pt-2">
                      <span>Net Payable:</span>
                      <span>₹{totals.netPayable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
