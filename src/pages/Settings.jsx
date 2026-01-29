const Settings = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
      <div className="space-y-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Company Profile</h3>
          <p className="text-sm text-gray-600">Company information and billing details</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm text-gray-600">Add and manage users</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Backup & Restore</h3>
          <p className="text-sm text-gray-600">Database backup and restore options</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
