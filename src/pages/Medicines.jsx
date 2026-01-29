import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    salt_composition: '',
    manufacturer: '',
    schedule: 'NONE',
    hsn_code: '',
    gst_percentage: 12,
    rack_location: '',
    unit: 'STRIP',
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const response = await api.medicines.list({ active_only: '1' });
      setMedicines(response.data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.medicines.create(formData);
      alert('Medicine added successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        salt_composition: '',
        manufacturer: '',
        schedule: 'NONE',
        hsn_code: '',
        gst_percentage: 12,
        rack_location: '',
        unit: 'STRIP',
      });
      loadMedicines();
    } catch (error) {
      alert(`Failed to add medicine: ${error.message}`);
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.salt_composition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medicine Master</h1>
          <p className="text-gray-600 mt-1">{medicines.length} medicines in database</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Medicine'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold text-lg mb-4">Add New Medicine</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salt Composition
                </label>
                <input
                  type="text"
                  value={formData.salt_composition}
                  onChange={(e) => setFormData({ ...formData, salt_composition: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <select
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="input"
                >
                  <option value="NONE">None</option>
                  <option value="H">H (Prescription)</option>
                  <option value="H1">H1 (Habit Forming)</option>
                  <option value="X">X (Narcotic)</option>
                  <option value="OTC">OTC (Over the Counter)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={formData.hsn_code}
                  onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST %
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Add Medicine
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Salt Composition</th>
                <th>Manufacturer</th>
                <th>Schedule</th>
                <th>HSN</th>
                <th>GST %</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td className="font-medium">{medicine.name}</td>
                  <td className="text-sm text-gray-600">{medicine.salt_composition || '-'}</td>
                  <td>{medicine.manufacturer || '-'}</td>
                  <td>
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                      {medicine.schedule}
                    </span>
                  </td>
                  <td>{medicine.hsn_code || '-'}</td>
                  <td>{medicine.gst_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Medicines;
