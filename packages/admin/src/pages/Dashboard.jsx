import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Spin } from 'antd';
import {
    FileTextOutlined,
    SkinOutlined,
    EyeOutlined,
    CloudDownloadOutlined,
} from '@ant-design/icons';
import { pageApi, themeApi, crawlerApi } from '../services/api';

const { Title } = Typography;

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pages: 0,
        themes: 0,
        crawledItems: 0,
        publishedPages: 0,
    });
    const [recentPages, setRecentPages] = useState([]);
    const [activeTheme, setActiveTheme] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [pagesRes, themesRes, crawlerRes] = await Promise.all([
                pageApi.getAll({ limit: 5 }),
                themeApi.getAll(),
                crawlerApi.getJobs({ limit: 5 }),
            ]);

            const pages = pagesRes.data.data || [];
            const themes = themesRes.data.data || [];
            const crawled = crawlerRes.data.data || [];

            setStats({
                pages: pagesRes.data.pagination?.total || pages.length,
                themes: themes.length,
                crawledItems: crawlerRes.data.pagination?.total || crawled.length,
                publishedPages: pages.filter(p => p.status === 'PUBLISHED').length,
            });

            setRecentPages(pages);
            setActiveTheme(themes.find(t => t.isActive));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Pages',
            value: stats.pages,
            icon: <FileTextOutlined />,
            color: '#6366f1',
        },
        {
            title: 'Published',
            value: stats.publishedPages,
            icon: <EyeOutlined />,
            color: '#10b981',
        },
        {
            title: 'Themes',
            value: stats.themes,
            icon: <SkinOutlined />,
            color: '#f59e0b',
        },
        {
            title: 'Crawled',
            value: stats.crawledItems,
            icon: <CloudDownloadOutlined />,
            color: '#ec4899',
        },
    ];

    const pageColumns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <a href={`/pages/${record.id}`}>{text}</a>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'PUBLISHED' ? 'green' : 'orange'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Template',
            dataIndex: 'template',
            key: 'template',
        },
        {
            title: 'Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date) => new Date(date).toLocaleDateString(),
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <Title level={3} style={{ marginBottom: 24 }}>Dashboard</Title>

            {/* Stats */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
                {statCards.map((card, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card className="stat-card">
                            <div
                                className="stat-icon"
                                style={{ background: `${card.color}20`, color: card.color }}
                            >
                                {card.icon}
                            </div>
                            <Statistic
                                title={card.title}
                                value={card.value}
                                valueStyle={{ color: card.color, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={24}>
                {/* Recent Pages */}
                <Col xs={24} lg={16}>
                    <Card title="Recent Pages" style={{ marginBottom: 24 }}>
                        <Table
                            dataSource={recentPages}
                            columns={pageColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                {/* Active Theme */}
                <Col xs={24} lg={8}>
                    <Card title="Active Theme" style={{ marginBottom: 24 }}>
                        {activeTheme ? (
                            <div>
                                <div style={{
                                    height: 150,
                                    background: '#f5f5f5',
                                    borderRadius: 8,
                                    marginBottom: 16,
                                    overflow: 'hidden',
                                }}>
                                    {activeTheme.thumbnail && (
                                        <img
                                            src={activeTheme.thumbnailUrl || `/themes/${activeTheme.path}/demo/images/thumbnail.jpg`}
                                            alt={activeTheme.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                                <Title level={5} style={{ marginBottom: 4 }}>
                                    {activeTheme.name}
                                </Title>
                                <p style={{ color: '#888', marginBottom: 8 }}>
                                    Version {activeTheme.version}
                                </p>
                                <p style={{ color: '#666' }}>
                                    {activeTheme.description}
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: '#888' }}>No active theme</p>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
