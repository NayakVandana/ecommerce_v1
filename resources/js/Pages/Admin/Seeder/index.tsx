import { useEffect, useState } from 'react';
import { useSeederStore } from './useSeederStore';
import AdminLayout from '../Layout';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import toast from '../../../utils/toast';
import {
    PlayIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function SeederIndex() {
    const [seeders, setSeeders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningSeeder, setRunningSeeder] = useState<string | null>(null);
    const [showRunModal, setShowRunModal] = useState(false);
    const [showRefreshModal, setShowRefreshModal] = useState(false);
    const [selectedSeeder, setSelectedSeeder] = useState<any>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadSeeders();
    }, []);

    const loadSeeders = async () => {
        try {
            setLoading(true);
            const response = await useSeederStore.list();
            if (response.data?.status) {
                setSeeders(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading seeders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunClick = (seeder: any) => {
        setSelectedSeeder(seeder);
        setShowRunModal(true);
    };

    const handleRefreshClick = (seeder: any) => {
        setSelectedSeeder(seeder);
        setShowRefreshModal(true);
    };

    const handleRunConfirm = async () => {
        if (!selectedSeeder) return;

        try {
            setRunningSeeder(selectedSeeder.class);
            setShowRunModal(false);

            const response = await useSeederStore.run({ seeder: selectedSeeder.class });
            
            if (response.data?.status) {
                toast({ message: `${selectedSeeder.name} seeder executed successfully`, type: 'success' });
                await loadSeeders();
            } else {
                setAlertMessage(response.data?.message || 'Failed to run seeder');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error running seeder:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to run seeder');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setRunningSeeder(null);
            setSelectedSeeder(null);
        }
    };

    const handleRefreshConfirm = async () => {
        if (!selectedSeeder) return;

        try {
            setRunningSeeder(selectedSeeder.class);
            setShowRefreshModal(false);

            const response = await useSeederStore.refresh({
                seeder: selectedSeeder.class,
                table: selectedSeeder.table,
            });
            
            if (response.data?.status) {
                toast({ 
                    message: `${selectedSeeder.name} seeder refreshed successfully (${response.data.data?.count || 0} records)`, 
                    type: 'success' 
                });
                await loadSeeders();
            } else {
                setAlertMessage(response.data?.message || 'Failed to refresh seeder');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error refreshing seeder:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to refresh seeder');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setRunningSeeder(null);
            setSelectedSeeder(null);
        }
    };

    const handleRunAll = async () => {
        if (!confirm('Are you sure you want to run all seeders? This may take a while.')) {
            return;
        }

        try {
            setRunningSeeder('all');
            const response = await useSeederStore.runAll();
            
            if (response.data?.status) {
                toast({ message: 'All seeders executed successfully', type: 'success' });
                await loadSeeders();
            } else {
                setAlertMessage(response.data?.message || 'Failed to run all seeders');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error running all seeders:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to run all seeders');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setRunningSeeder(null);
        }
    };

    return (
        <AdminLayout currentPath="/admin/seeders">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Database Seeders</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage and run database seeders</p>
                    </div>
                    <button
                        onClick={handleRunAll}
                        disabled={runningSeeder === 'all'}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlayIcon className="h-5 w-5 mr-2" />
                        {runningSeeder === 'all' ? 'Running...' : 'Run All Seeders'}
                    </button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                        <div className="text-sm text-blue-700">
                            <p className="font-semibold mb-1">About Seeders</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Run:</strong> Executes the seeder and adds new records (does not delete existing data)</li>
                                <li><strong>Refresh:</strong> Clears the table and re-runs the seeder (deletes all existing data first)</li>
                                <li><strong>Run All:</strong> Executes all seeders in the correct order</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Seeder Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Table
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Records
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {seeders.map((seeder: any) => (
                                    <tr key={seeder.class} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{seeder.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{seeder.class}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">{seeder.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 font-mono">{seeder.table}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {seeder.count || 0} records
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-2">
                                                <button
                                                    onClick={() => handleRunClick(seeder)}
                                                    disabled={runningSeeder === seeder.class || runningSeeder === 'all'}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Run Seeder"
                                                >
                                                    <PlayIcon className="h-4 w-4 mr-1" />
                                                    Run
                                                </button>
                                                <button
                                                    onClick={() => handleRefreshClick(seeder)}
                                                    disabled={runningSeeder === seeder.class || runningSeeder === 'all'}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Refresh Seeder (Clear & Re-seed)"
                                                >
                                                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                                                    Refresh
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Run Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showRunModal}
                    onClose={() => {
                        setShowRunModal(false);
                        setSelectedSeeder(null);
                    }}
                    onConfirm={handleRunConfirm}
                    title="Run Seeder"
                    message={`Are you sure you want to run the "${selectedSeeder?.name}" seeder? This will add new records without deleting existing data.`}
                    confirmText="Run"
                    cancelText="Cancel"
                    confirmButtonColor="indigo"
                />

                {/* Refresh Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showRefreshModal}
                    onClose={() => {
                        setShowRefreshModal(false);
                        setSelectedSeeder(null);
                    }}
                    onConfirm={handleRefreshConfirm}
                    title="Refresh Seeder"
                    message={`Are you sure you want to refresh the "${selectedSeeder?.name}" seeder? This will DELETE ALL existing data in the "${selectedSeeder?.table}" table and re-seed it. This action cannot be undone!`}
                    confirmText="Refresh"
                    cancelText="Cancel"
                    confirmButtonColor="red"
                />

                {/* Alert Modal */}
                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    message={alertMessage}
                    type={alertType}
                />
            </div>
        </AdminLayout>
    );
}

