import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Layout, Card, Button, Space, Typography, message, Spin, Modal,
    Form, Input, Select, Switch, Tabs, Collapse, InputNumber, Empty,
    Tooltip, Drawer, Divider
} from 'antd';
import {
    ArrowLeftOutlined, SaveOutlined, EyeOutlined, PlusOutlined,
    DeleteOutlined, EditOutlined, HolderOutlined, DesktopOutlined,
    MobileOutlined, TabletOutlined, ReloadOutlined
} from '@ant-design/icons';
import { pageApi, themeApi, postApi, productApi } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// Section type definitions
const SECTION_TYPES = [
    { type: 'hero', name: 'Hero Banner', icon: '🎯', desc: 'Large banner with title and CTA' },
    { type: 'product_grid', name: 'Product Grid', icon: '🛒', desc: 'Display products in grid' },
    { type: 'product_carousel', name: 'Product Carousel', icon: '🎠', desc: 'Scrollable product slider' },
    { type: 'post_grid', name: 'Blog Posts Grid', icon: '📰', desc: 'Display blog posts' },
    { type: 'post_slider', name: 'Blog Posts Slider', icon: '📑', desc: 'Scrollable posts slider' },
    { type: 'categories', name: 'Category Showcase', icon: '📁', desc: 'Display categories' },
    { type: 'banner', name: 'Banner / CTA', icon: '📣', desc: 'Promotional banner' },
    { type: 'newsletter', name: 'Newsletter', icon: '📧', desc: 'Email subscription form' },
    { type: 'trust_badges', name: 'Trust Badges', icon: '✅', desc: 'Trust and feature icons' },
    { type: 'rich_text', name: 'Rich Text', icon: '📝', desc: 'Custom text content' },
    { type: 'spacer', name: 'Spacer', icon: '↕️', desc: 'Add vertical space' },
];

// Default settings for each section type
const getDefaultSettings = (type) => {
    const defaults = {
        hero: {
            title: 'Welcome to Our Store',
            subtitle: 'Discover amazing products',
            backgroundImage: '',
            overlayColor: 'rgba(0,0,0,0.4)',
            textAlign: 'center',
            buttons: [{ text: 'Shop Now', url: '/products', style: 'primary' }]
        },
        product_grid: {
            title: 'Featured Products',
            subtitle: '',
            categoryId: null,
            limit: 4,
            columns: 4,
            showFeaturedOnly: false
        },
        product_carousel: {
            title: 'New Arrivals',
            subtitle: '',
            categoryId: null,
            limit: 8,
            showFeaturedOnly: false
        },
        post_grid: {
            title: 'Latest Articles',
            subtitle: '',
            categoryId: null,
            limit: 3,
            columns: 3
        },
        post_slider: {
            title: 'From Our Blog',
            subtitle: '',
            categoryId: null,
            limit: 6,
            showExcerpt: true
        },
        categories: {
            title: 'Shop by Category',
            subtitle: '',
            type: 'product', // product or post
            showCount: true
        },
        banner: {
            title: 'Special Offer',
            subtitle: 'Limited time only',
            backgroundImage: '',
            backgroundColor: '#0071e3',
            textColor: '#ffffff',
            buttonText: 'Learn More',
            buttonUrl: '#'
        },
        newsletter: {
            title: 'Subscribe to Our Newsletter',
            subtitle: 'Get the latest updates and offers',
            buttonText: 'Subscribe'
        },
        trust_badges: {
            title: '',
            items: [
                { icon: 'truck', title: 'Free Shipping', desc: 'On orders over $100' },
                { icon: 'shield', title: 'Secure Payment', desc: '100% secure checkout' },
                { icon: 'refresh', title: 'Easy Returns', desc: '30-day return policy' },
                { icon: 'headphones', title: '24/7 Support', desc: 'Always here to help' }
            ]
        },
        rich_text: {
            content: '<p>Enter your content here...</p>'
        },
        spacer: {
            height: 60
        }
    };
    return defaults[type] || {};
};

// Generate unique ID
const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function PageBuilderEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id || id === 'new';

    // State
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState({ title: '', slug: '', template: 'home' });
    const [sections, setSections] = useState([]);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
    const [previewDevice, setPreviewDevice] = useState('desktop');
    const [previewKey, setPreviewKey] = useState(0);
    const [themes, setThemes] = useState([]);
    const [postCategories, setPostCategories] = useState([]);
    const [productCategories, setProductCategories] = useState([]);

    const [form] = Form.useForm();
    const [sectionForm] = Form.useForm();

    // Load data on mount
    useEffect(() => {
        loadInitialData();
        if (!isNew) loadPage();
    }, [id]);

    const loadInitialData = async () => {
        try {
            const [themesRes, postCatRes, prodCatRes] = await Promise.all([
                themeApi.getAll(),
                postApi.getCategories(),
                productApi.getCategories()
            ]);
            setThemes(themesRes.data.data || []);
            setPostCategories(postCatRes.data.data || []);
            setProductCategories(prodCatRes.data.data || []);
        } catch (error) {
            console.error('Failed to load data');
        }
    };

    const loadPage = async () => {
        try {
            const response = await pageApi.getOne(id);
            const pageData = response.data.data;
            setPage(pageData);
            form.setFieldsValue(pageData);

            // Load sections from content
            if (pageData.content?.sections) {
                setSections(pageData.content.sections);
            }
        } catch (error) {
            message.error('Failed to load page');
            navigate('/pages');
        } finally {
            setLoading(false);
        }
    };

    // Section management
    const addSection = (type) => {
        const newSection = {
            id: generateId(),
            type,
            order: sections.length,
            settings: getDefaultSettings(type)
        };
        setSections([...sections, newSection]);
        setAddModalOpen(false);
        setEditingSection(newSection);
        sectionForm.setFieldsValue(newSection.settings);
        setSettingsDrawerOpen(true);
        refreshPreview();
    };

    const updateSection = (sectionId, newSettings) => {
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, settings: { ...s.settings, ...newSettings } } : s
        ));
        refreshPreview();
    };

    const deleteSection = (sectionId) => {
        Modal.confirm({
            title: 'Delete Section?',
            content: 'This action cannot be undone.',
            onOk: () => {
                setSections(sections.filter(s => s.id !== sectionId));
                if (editingSection?.id === sectionId) {
                    setEditingSection(null);
                    setSettingsDrawerOpen(false);
                }
                refreshPreview();
            }
        });
    };

    const moveSection = (index, direction) => {
        const newSections = [...sections];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= sections.length) return;
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        newSections.forEach((s, i) => s.order = i);
        setSections(newSections);
        refreshPreview();
    };

    const refreshPreview = useCallback(() => {
        setPreviewKey(k => k + 1);
    }, []);

    // Save handler
    const handleSave = async (publish = false) => {
        setSaving(true);
        try {
            const values = form.getFieldsValue();
            const data = {
                ...values,
                status: publish ? 'PUBLISHED' : page.status || 'DRAFT',
                content: { sections }
            };

            if (isNew) {
                const response = await pageApi.create(data);
                message.success('Page created!');
                navigate(`/pages/${response.data.data.id}/builder`);
            } else {
                await pageApi.update(id, data);
                message.success(publish ? 'Page published!' : 'Page saved!');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save page');
        } finally {
            setSaving(false);
        }
    };

    // Build preview URL
    const getPreviewUrl = () => {
        const baseUrl = 'http://localhost:3000';
        if (page.slug === 'home' || page.isHomepage) return baseUrl;
        return `${baseUrl}/${page.slug || 'preview'}`;
    };

    // Section settings form save
    const handleSectionSettingsSave = () => {
        const values = sectionForm.getFieldsValue();
        if (editingSection) {
            updateSection(editingSection.id, values);
            message.success('Section updated');
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* Top Header */}
            <Header style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e8e8e8',
                height: 56
            }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/pages')}>
                        Back
                    </Button>
                    <Divider type="vertical" />
                    <Form form={form} layout="inline">
                        <Form.Item name="title" style={{ marginBottom: 0, width: 200 }}>
                            <Input placeholder="Page Title" size="small" />
                        </Form.Item>
                    </Form>
                </Space>
                <Space>
                    <Button.Group>
                        <Tooltip title="Desktop"><Button icon={<DesktopOutlined />} type={previewDevice === 'desktop' ? 'primary' : 'default'} onClick={() => setPreviewDevice('desktop')} /></Tooltip>
                        <Tooltip title="Tablet"><Button icon={<TabletOutlined />} type={previewDevice === 'tablet' ? 'primary' : 'default'} onClick={() => setPreviewDevice('tablet')} /></Tooltip>
                        <Tooltip title="Mobile"><Button icon={<MobileOutlined />} type={previewDevice === 'mobile' ? 'primary' : 'default'} onClick={() => setPreviewDevice('mobile')} /></Tooltip>
                    </Button.Group>
                    <Button icon={<ReloadOutlined />} onClick={refreshPreview}>Refresh</Button>
                    <Divider type="vertical" />
                    <Button icon={<SaveOutlined />} onClick={() => handleSave(false)} loading={saving}>Save Draft</Button>
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => handleSave(true)} loading={saving}>Publish</Button>
                </Space>
            </Header>

            <Layout>
                {/* Left Sidebar - Sections */}
                <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #e8e8e8', overflow: 'auto' }}>
                    <div style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>Sections</Title>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                                Add Section
                            </Button>
                        </div>

                        {sections.length === 0 ? (
                            <Empty description="No sections yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                                <Button type="primary" onClick={() => setAddModalOpen(true)}>Add First Section</Button>
                            </Empty>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {sections.map((section, index) => {
                                    const typeInfo = SECTION_TYPES.find(t => t.type === section.type);
                                    return (
                                        <Card
                                            key={section.id}
                                            size="small"
                                            style={{
                                                cursor: 'pointer',
                                                border: editingSection?.id === section.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                                            }}
                                            onClick={() => {
                                                setEditingSection(section);
                                                sectionForm.setFieldsValue(section.settings);
                                                setSettingsDrawerOpen(true);
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <HolderOutlined style={{ color: '#999', cursor: 'move' }} />
                                                <span style={{ fontSize: 20 }}>{typeInfo?.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <Text strong>{typeInfo?.name}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {section.settings.title || 'No title'}
                                                    </Text>
                                                </div>
                                                <Space size="small">
                                                    <Button size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); setEditingSection(section); sectionForm.setFieldsValue(section.settings); setSettingsDrawerOpen(true); }} />
                                                    <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} />
                                                </Space>
                                            </div>
                                            <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                                                <Button size="small" disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveSection(index, -1); }}>↑</Button>
                                                <Button size="small" disabled={index === sections.length - 1} onClick={(e) => { e.stopPropagation(); moveSection(index, 1); }}>↓</Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <Divider />

                        {/* Page Settings */}
                        <Collapse defaultActiveKey={['settings']}>
                            <Panel header="Page Settings" key="settings">
                                <Form form={form} layout="vertical" size="small">
                                    <Form.Item name="slug" label="Slug">
                                        <Input addonBefore="/" placeholder="page-url" />
                                    </Form.Item>
                                    <Form.Item name="template" label="Template">
                                        <Select>
                                            <Select.Option value="home">Home</Select.Option>
                                            <Select.Option value="page">Page</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="isHomepage" label="Set as Homepage" valuePropName="checked">
                                        <Switch />
                                    </Form.Item>
                                </Form>
                            </Panel>
                            <Panel header="SEO Settings" key="seo">
                                <Form form={form} layout="vertical" size="small">
                                    <Form.Item name="seoTitle" label="SEO Title">
                                        <Input placeholder="Page title for search engines" />
                                    </Form.Item>
                                    <Form.Item name="seoDesc" label="Meta Description">
                                        <TextArea rows={2} placeholder="Description for search engines" />
                                    </Form.Item>
                                </Form>
                            </Panel>
                        </Collapse>
                    </div>
                </Sider>

                {/* Main Content - Preview */}
                <Content style={{ padding: 24, overflow: 'auto' }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        margin: '0 auto',
                        width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? 768 : 375,
                        transition: 'width 0.3s ease'
                    }}>
                        <div style={{ background: '#f5f5f5', padding: '8px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }}></span>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }}></span>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }}></span>
                            <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>{getPreviewUrl()}</span>
                        </div>
                        <iframe
                            key={previewKey}
                            src={`${getPreviewUrl()}?preview=1&t=${Date.now()}`}
                            style={{
                                width: '100%',
                                height: 'calc(100vh - 180px)',
                                border: 'none'
                            }}
                            title="Page Preview"
                        />
                    </div>
                </Content>
            </Layout>

            {/* Add Section Modal */}
            <Modal
                title="Add Section"
                open={addModalOpen}
                onCancel={() => setAddModalOpen(false)}
                footer={null}
                width={600}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {SECTION_TYPES.map(type => (
                        <Card
                            key={type.type}
                            hoverable
                            size="small"
                            onClick={() => addSection(type.type)}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 8 }}>{type.icon}</div>
                            <Text strong>{type.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>{type.desc}</Text>
                        </Card>
                    ))}
                </div>
            </Modal>

            {/* Section Settings Drawer */}
            <Drawer
                title={editingSection ? `Edit ${SECTION_TYPES.find(t => t.type === editingSection.type)?.name}` : 'Section Settings'}
                open={settingsDrawerOpen}
                onClose={() => { setSettingsDrawerOpen(false); setEditingSection(null); }}
                width={400}
                extra={
                    <Button type="primary" onClick={handleSectionSettingsSave}>Apply Changes</Button>
                }
            >
                {editingSection && (
                    <Form form={sectionForm} layout="vertical" onValuesChange={(_, values) => updateSection(editingSection.id, values)}>
                        <SectionSettingsForm type={editingSection.type} productCategories={productCategories} postCategories={postCategories} />
                    </Form>
                )}
            </Drawer>
        </Layout>
    );
}

// Dynamic section settings form based on type
function SectionSettingsForm({ type, productCategories, postCategories }) {
    switch (type) {
        case 'hero':
            return (
                <>
                    <Form.Item name="title" label="Title"><Input /></Form.Item>
                    <Form.Item name="subtitle" label="Subtitle"><Input /></Form.Item>
                    <Form.Item name="backgroundImage" label="Background Image URL"><Input placeholder="/uploads/hero.jpg" /></Form.Item>
                    <Form.Item name="textAlign" label="Text Align">
                        <Select><Select.Option value="left">Left</Select.Option><Select.Option value="center">Center</Select.Option><Select.Option value="right">Right</Select.Option></Select>
                    </Form.Item>
                </>
            );
        case 'product_grid':
        case 'product_carousel':
            return (
                <>
                    <Form.Item name="title" label="Title"><Input /></Form.Item>
                    <Form.Item name="subtitle" label="Subtitle"><Input /></Form.Item>
                    <Form.Item name="categoryId" label="Category">
                        <Select allowClear placeholder="All Categories">
                            {productCategories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="limit" label="Number of Items"><InputNumber min={1} max={20} /></Form.Item>
                    {type === 'product_grid' && <Form.Item name="columns" label="Columns"><InputNumber min={2} max={6} /></Form.Item>}
                    <Form.Item name="showFeaturedOnly" label="Featured Only" valuePropName="checked"><Switch /></Form.Item>
                </>
            );
        case 'post_grid':
        case 'post_slider':
            return (
                <>
                    <Form.Item name="title" label="Title"><Input /></Form.Item>
                    <Form.Item name="subtitle" label="Subtitle"><Input /></Form.Item>
                    <Form.Item name="categoryId" label="Category">
                        <Select allowClear placeholder="All Categories">
                            {postCategories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="limit" label="Number of Items"><InputNumber min={1} max={20} /></Form.Item>
                    {type === 'post_grid' && <Form.Item name="columns" label="Columns"><InputNumber min={2} max={4} /></Form.Item>}
                    <Form.Item name="showExcerpt" label="Show Excerpt" valuePropName="checked"><Switch /></Form.Item>
                </>
            );
        case 'banner':
            return (
                <>
                    <Form.Item name="title" label="Title"><Input /></Form.Item>
                    <Form.Item name="subtitle" label="Subtitle"><Input /></Form.Item>
                    <Form.Item name="backgroundColor" label="Background Color"><Input type="color" /></Form.Item>
                    <Form.Item name="backgroundImage" label="Background Image"><Input placeholder="/uploads/banner.jpg" /></Form.Item>
                    <Form.Item name="buttonText" label="Button Text"><Input /></Form.Item>
                    <Form.Item name="buttonUrl" label="Button URL"><Input /></Form.Item>
                </>
            );
        case 'newsletter':
            return (
                <>
                    <Form.Item name="title" label="Title"><Input /></Form.Item>
                    <Form.Item name="subtitle" label="Subtitle"><Input /></Form.Item>
                    <Form.Item name="buttonText" label="Button Text"><Input /></Form.Item>
                </>
            );
        case 'categories':
            return (
                <>
                    <Form.Item name="title" label="Title"><Input /></Form.Item>
                    <Form.Item name="subtitle" label="Subtitle"><Input /></Form.Item>
                    <Form.Item name="type" label="Category Type">
                        <Select><Select.Option value="product">Product Categories</Select.Option><Select.Option value="post">Post Categories</Select.Option></Select>
                    </Form.Item>
                    <Form.Item name="showCount" label="Show Item Count" valuePropName="checked"><Switch /></Form.Item>
                </>
            );
        case 'spacer':
            return <Form.Item name="height" label="Height (px)"><InputNumber min={20} max={200} /></Form.Item>;
        case 'rich_text':
            return <Form.Item name="content" label="Content"><TextArea rows={10} /></Form.Item>;
        default:
            return <Text type="secondary">No settings available</Text>;
    }
}
