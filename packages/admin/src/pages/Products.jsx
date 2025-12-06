import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Input, Select, Modal, message, Typography, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productApi } from '../services/api';

const { Title } = Typography;
const { Search } = Input;

export default function Products() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filters, setFilters] = useState({ status: '', category: '', search: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [pagination.current, filters]);

    const loadCategories = async () => {
        try {
            const response = await productApi.getCategories();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await productApi.getAll({
                page: pagination.current,
                limit: pagination.pageSize,
                ...filters
            });
            setProducts(response.data.data || []);
            setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }));
        } catch (error) {
            message.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (product) => {
        Modal.confirm({
            title: 'Delete Product?',
            content: `Are you sure you want to delete "${product.name}"?`,
            okType: 'danger',
            onOk: async () => {
                try {
                    await productApi.delete(product.id);
                    message.success('Product deleted');
                    loadProducts();
                } catch (error) {
                    message.error('Failed to delete product');
                }
            }
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    };

    const columns = [
        {
            title: 'Product',
            key: 'product',
            render: (_, record) => (
                <Space>
                    {record.images?.[0] && (
                        <Image src={record.images[0]} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    )}
                    <div>
                        <strong>{record.name}</strong>
                        {record.isFeatured && <Tag color="gold" style={{ marginLeft: 8 }}>Featured</Tag>}
                        <div style={{ color: '#888', fontSize: 12 }}>SKU: {record.sku || 'N/A'}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: cat => cat ? <Tag color="purple">{cat.name}</Tag> : '-'
        },
        {
            title: 'Price',
            key: 'price',
            render: (_, record) => (
                <div>
                    {record.salePrice ? (
                        <>
                            <span style={{ textDecoration: 'line-through', color: '#888' }}>{formatPrice(record.price)}</span>
                            <span style={{ color: '#f5222d', marginLeft: 8 }}>{formatPrice(record.salePrice)}</span>
                        </>
                    ) : (
                        formatPrice(record.price)
                    )}
                </div>
            )
        },
        {
            title: 'Stock',
            dataIndex: 'stock',
            key: 'stock',
            render: stock => (
                <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
                    {stock > 0 ? stock : 'Out of stock'}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                const colors = { ACTIVE: 'green', DRAFT: 'orange', OUT_OF_STOCK: 'red', DISCONTINUED: 'default' };
                return <Tag color={colors[status]}>{status}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => navigate(`/products/${record.id}`)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)} />
                </Space>
            )
        }
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Products</Title>
                <Space>
                    <Button onClick={() => navigate('/products/categories')}>Categories</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
                        New Product
                    </Button>
                </Space>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                <Search
                    placeholder="Search products..."
                    allowClear
                    style={{ width: 250 }}
                    onSearch={val => setFilters(f => ({ ...f, search: val }))}
                />
                <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: 150 }}
                    onChange={val => setFilters(f => ({ ...f, status: val || '' }))}
                    options={[
                        { label: 'Active', value: 'ACTIVE' },
                        { label: 'Draft', value: 'DRAFT' },
                        { label: 'Out of Stock', value: 'OUT_OF_STOCK' }
                    ]}
                />
                <Select
                    placeholder="Category"
                    allowClear
                    style={{ width: 180 }}
                    onChange={val => setFilters(f => ({ ...f, category: val || '' }))}
                    options={categories.map(c => ({ label: c.name, value: c.id }))}
                />
            </div>

            <Table
                columns={columns}
                dataSource={products}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: total => `Total ${total} products`,
                    onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
                }}
            />
        </div>
    );
}
