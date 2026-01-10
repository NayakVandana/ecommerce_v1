import { useEffect, useState } from 'react';
import { useCategoryStore } from './useCategoryStore';
import AdminLayout from '../Layout';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function CategoryIndex() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        is_featured: false,
    });
    const [errors, setErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (editingCategory) {
            setFormData({
                name: editingCategory.name || '',
                slug: editingCategory.slug || '',
                description: editingCategory.description || '',
                is_featured: editingCategory.is_featured || false,
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                description: '',
                is_featured: false,
            });
        }
        setErrors({});
    }, [editingCategory]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await useCategoryStore.list();
            if (response.data?.status) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate slug from name
        if (name === 'name' && !editingCategory) {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            let response;
            if (editingCategory) {
                // Update existing category
                response = await useCategoryStore.update({
                    id: editingCategory.id,
                    ...formData
                });
            } else {
                // Create new category
                response = await useCategoryStore.store(formData);
            }

            if (response.data?.status) {
                setShowModal(false);
                setEditingCategory(null);
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    is_featured: false,
                });
                setErrors({});
                loadCategories();
                toast({ message: editingCategory ? 'Category updated successfully' : 'Category created successfully', type: 'success' });
            } else {
                // Handle validation errors
                if (response.data?.errors) {
                    setErrors(response.data.errors);
                } else if (response.data?.message) {
                    setErrors({ general: response.data.message });
                }
            }
        } catch (error: any) {
            console.error('Error saving category:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'An error occurred while saving the category' });
            }
        } finally {
            setSubmitting(false);
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

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            is_featured: false,
        });
        setErrors({});
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
                                    categories.map((category: any) => (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {category.name}
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No categories found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <form onSubmit={handleSubmit}>
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="text-gray-400 hover:text-gray-500"
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        {errors.general && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-sm text-red-600">{errors.general}</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {/* Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter category name"
                                                />
                                                {errors.name && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                                )}
                                            </div>

                                            {/* Slug */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Slug <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="slug"
                                                    value={formData.slug}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                        errors.slug ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="category-slug"
                                                />
                                                {errors.slug && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    URL-friendly version of the name (auto-generated from name)
                                                </p>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    rows={4}
                                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                        errors.description ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter category description (optional)"
                                                />
                                                {errors.description && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                                )}
                                            </div>

                                            {/* Is Featured */}
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="is_featured"
                                                    id="is_featured"
                                                    checked={formData.is_featured}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                                                    Featured Category
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

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

