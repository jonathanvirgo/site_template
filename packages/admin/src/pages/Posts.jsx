import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Input, Select, Modal, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { postApi } from '../services/api';

const { Title } = Typography;
const { Search } = Input;

export default function Posts() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filters, setFilters] = useState({ status: '', category: '', search: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadPosts();
    }, [pagination.current, filters]);

    const loadCategories = async () => {
        try {
            const response = await postApi.getCategories();
            setCategories(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadPosts = async () => {
        setLoading(true);
        try {
            const response = await postApi.getAll({
                page: pagination.current,
                limit: pagination.pageSize,
                ...filters
            });
            setPosts(response.data.data || []);
            setPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }));
        } catch (error) {
            message.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (post) => {
        Modal.confirm({
            title: 'Delete Post?',
            content: `Are you sure you want to delete "${post.title}"?`,
            okType: 'danger',
            onOk: async () => {
                try {
                    await postApi.delete(post.id);
                    message.success('Post deleted');
                    loadPosts();
                } catch (error) {
                    message.error('Failed to delete post');
                }
            }
        });
    };

    const handlePublish = async (post) => {
        try {
            if (post.status === 'PUBLISHED') {
                await postApi.unpublish(post.id);
                message.success('Post unpublished');
            } else {
                await postApi.publish(post.id);
                message.success('Post published');
            }
            loadPosts();
        } catch (error) {
            message.error('Failed to update post status');
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <strong>{text}</strong>
                    {record.isFeatured && <Tag color="gold" style={{ marginLeft: 8 }}>Featured</Tag>}
                    <div style={{ color: '#888', fontSize: 12 }}>/{record.slug}</div>
                </div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: cat => cat ? <Tag color="blue">{cat.name}</Tag> : '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'PUBLISHED' ? 'green' : 'orange'}>{status}</Tag>
            )
        },
        {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            render: views => views.toLocaleString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => navigate(`/posts/${record.id}`)} />
                    <Button icon={<EyeOutlined />} onClick={() => handlePublish(record)}>
                        {record.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)} />
                </Space>
            )
        }
    ];

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Posts</Title>
                <Space>
                    <Button onClick={() => navigate('/posts/categories')}>Categories</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/posts/new')}>
                        New Post
                    </Button>
                </Space>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                <Search
                    placeholder="Search posts..."
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
                        { label: 'Published', value: 'PUBLISHED' },
                        { label: 'Draft', value: 'DRAFT' }
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
                dataSource={posts}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showTotal: total => `Total ${total} posts`,
                    onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
                }}
            />
        </div>
    );
}
