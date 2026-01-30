import { useEffect, useState } from 'react';
import { useCategoryStore } from './useCategoryStore';
import AdminLayout from '../Layout';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import CategoryModal from './CategoryModal';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

export default function CategoryIndex() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await useCategoryStore.list();
            if (response.data?.status) {
                // Use flat list for display and modal
                const flatCategories = response.data.data?.flat || response.data.data || [];
                
                // Sort categories: parent categories first, then subcategories grouped under their parents
                const sortedCategories = [...flatCategories].sort((a: any, b: any) => {
                    // If both have parent_id, sort by parent_id first, then by name
                    if (a.parent_id && b.parent_id) {
                        if (a.parent_id !== b.parent_id) {
                            return a.parent_id - b.parent_id;
                        }
                        return (a.name || '').localeCompare(b.name || '');
                    }
                    // If only one has parent_id, the one without comes first
                    if (a.parent_id && !b.parent_id) return 1;
                    if (!a.parent_id && b.parent_id) return -1;
                    // If neither has parent_id, sort by name
                    return (a.name || '').localeCompare(b.name || '');
                });
                
                setCategories(sortedCategories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleDeleteClick = (categoryId: number) => {
        setDeleteCategoryId(categoryId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCategoryId) return;
        
        try {
            const response = await useCategoryStore.delete({ id: deleteCategoryId });
            if (response.data?.status) {
                loadCategories();
                setShowDeleteModal(false);
                setDeleteCategoryId(null);
                toast({ message: 'Category deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                const errorMsg = response.data?.message || 'Failed to delete category';
                setAlertMessage(errorMsg);
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting category:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete category';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleModalSuccess = () => {
        loadCategories();
    };

    return (
        <AdminLayout currentPath="/admin/categories">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage product categories</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setShowModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Category
                    </button>
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
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Parent Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Products
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Featured
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.length > 0 ? (
                                    categories.map((category: any) => {
                                        // Calculate indentation level based on parent hierarchy
                                        const getIndentLevel = (cat: any, allCats: any[], level = 0): number => {
                                            if (!cat.parent_id) return level;
                                            const parent = allCats.find((c: any) => c.id === cat.parent_id);
                                            return parent ? getIndentLevel(parent, allCats, level + 1) : level;
                                        };
                                        const indentLevel = getIndentLevel(category, categories);
                                        
                                        return (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 flex items-center" style={{ paddingLeft: `${indentLevel * 24}px` }}>
                                                    {indentLevel > 0 && (
                                                        <span className="mr-2 text-gray-400">└─</span>
                                                    )}
                                                    {category.name}
                                                    {category.parent_id && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            (Subcategory)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {category.parent_id ? (
                                                        categories.find((c: any) => c.id === category.parent_id)?.name || 'Unknown'
                                                    ) : (
                                                        <span className="text-gray-400 italic">Main Category</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {category.slug}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    {category.description || 'No description'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {category.products_count || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {category.is_featured ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(category);
                                                            setShowModal(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(category.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No categories found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Category Modal */}
                <CategoryModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    editingCategory={editingCategory}
                    onSuccess={handleModalSuccess}
                    categories={categories}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteCategoryId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Category"
                    message="Are you sure you want to delete this category? This action cannot be undone."
                    confirmText="Delete"
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

