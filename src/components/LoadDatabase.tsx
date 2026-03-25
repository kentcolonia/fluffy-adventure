import { useState, useEffect } from 'react';
import { Users, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================
export interface ApiEmployee {
  id?: string;
  employee_id?: string;
  name?: string;
  full_name?: string;
  fullname?: string;
  department?: string;
  status?: string;
  position?: string;
  [key: string]: any; // Catch-all for other potential API fields
}

interface LoadDatabaseProps {
  employeeDatabase?: any; // Typed as 'any' to avoid mismatch with src/types.ts
  setEmployeeDatabase?: any; // Typed as 'any' to avoid strict Dispatch type mismatch
}

// ==========================================
// MAIN COMPONENT (Directly loads Dashboard)
// ==========================================
export default function LoadDatabase({ setEmployeeDatabase }: LoadDatabaseProps) {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  // Increased limit to 2500 to fetch the entire database at once (replacing the old Excel behavior)
  const LIMIT = 2500;

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError('');

    try {
      // ---------------------------------------------------------
      // Pointing directly to YOUR local Node.js backend server
      // Changed to port 3000 to match your backend .env file
      // ---------------------------------------------------------
      const url = new URL('http://localhost:3000/api/employees');
      if (searchQuery) url.searchParams.append('search', searchQuery);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', LIMIT.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee data from backend server.');
      }

      const data = await response.json();
      
      // Assuming your backend returns the raw API array or a data object
      const rawData = data.data || data || [];
      
      // Map the data so it matches both the table UI and the parent App.tsx needs
      const fetchedData = rawData.map((emp: any) => ({
        ...emp,
        // Ensure standard properties exist for the rest of your app's logic
        id: emp.employee_id || emp.id, 
        name: emp.full_name || emp.fullname || emp.name || 'Unknown',
      }));

      setEmployees(fetchedData);
      
      // Pass the data up to your parent component (App.tsx)
      if (setEmployeeDatabase) {
        setEmployeeDatabase(fetchedData);
      }
      
    } catch (err) {
      console.error('Fetch Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data.';
      setError(errorMessage);
      
      // MOCK DATA FOR DEMONSTRATION IF BACKEND FAILS
      const mockData: ApiEmployee[] = [
        { id: 'ABMCI-001', employee_id: 'ABMCI-001', full_name: 'MAKIG-ANGAY, NIKKI', name: 'MAKIG-ANGAY, NIKKI', department: 'IT', status: 'Active', position: 'Developer' },
        { id: 'ABMCI-002', employee_id: 'ABMCI-002', full_name: 'DOE, JANE', name: 'DOE, JANE', department: 'HR', status: 'Active', position: 'Manager' },
      ];
      
      setEmployees(mockData);
      if (setEmployeeDatabase) {
        setEmployeeDatabase(mockData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or when search/page changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, page]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg text-white mr-3">
                  <Users size={24} />
                </div>
                <span className="font-bold text-xl text-slate-800">HRIS Portal</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-slate-500 mr-4">Connected via Local Backend</span>
              <button
                onClick={fetchEmployees}
                className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
              <p className="text-sm text-slate-500">Live data proxied securely through server.js</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Backend Connection Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <p className="mt-2 text-xs text-red-600 font-mono">Showing mock data instead. Make sure server.js is running.</p>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
            {isLoading && employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 text-sm">Fetching records from backend API...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Users className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg font-medium">No employees found</p>
                <p className="text-slate-400 text-sm">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {employees.map((employee, idx) => (
                      <tr key={employee.employee_id || employee.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {employee.employee_id || employee.id || idx}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {employee.full_name || employee.fullname || employee.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {employee.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (employee.status || '').toLowerCase() === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {employee.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Simple Pagination Controls */}
            <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing page <span className="font-medium">{page + 1}</span> (Limit: {LIMIT})
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={employees.length < LIMIT}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}