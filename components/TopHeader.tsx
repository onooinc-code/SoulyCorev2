
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import { 
    DashboardIcon, RocketLaunchIcon, BrainIcon, MemoryIcon, UsersIcon, 
    PromptsIcon, ToolsIcon, CircleStackIcon, CodeIcon, 
    ChatBubbleLeftRightIcon, SearchIcon, ClipboardDocumentListIcon, 
    RssIcon, LightbulbIcon, ScissorsIcon, ChevronDownIcon
} from '@/components/Icons';

const menuConfig = [
    { label: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
    { label: 'Chat', view: 'chat', icon: ChatBubbleLeftRightIcon },
    { 
        label: 'Core Engine', 
        icon: BrainIcon,
        children: [
            { label: 'Agent Center', view: 'agent_center', icon: RocketLaunchIcon, description: 'Launch & monitor autonomous agents.' },
            { label: 'Brain Center', view: 'brain_center', icon: BrainIcon, description: 'Manage AI Brain configurations.' },
            { label: 'Memory Center', view: 'memory_center', icon: MemoryIcon, description: 'Manage entities & relationships.' },
            { label: 'Experiences Hub', view: 'experiences_hub', icon: LightbulbIcon, description: 'View learned agent workflows.' },
        ]
    },
    {
        label: 'Data & Memory',
        icon: CircleStackIcon,
        children: [
            { label: 'Contacts Hub', view: 'contacts_hub', icon: UsersIcon, description: 'Manage personal & professional contacts.' },
            { label: 'Prompts Hub', view: 'prompts_hub', icon: PromptsIcon, description: 'Create reusable prompts & workflows.' },
            { label: 'Tools Hub', view: 'tools_hub', icon: ToolsIcon, description: 'Define agent capabilities & tools.' },
            { label: 'Data Hub', view: 'data_hub', icon: CircleStackIcon, description: 'Monitor all connected data sources.' },
            { label: 'Memory Extraction', view: 'memory_extraction_hub', icon: ScissorsIcon, description: 'Extract knowledge from sources.' },
        ]
    },
    { 
        label: 'Productivity', 
        icon: ClipboardDocumentListIcon,
        children: [
            { label: 'Projects Hub', view: 'projects_hub', icon: ClipboardDocumentListIcon, description: 'Manage projects and their tasks.' },
            { label: 'Global Search', view: 'search', icon: SearchIcon, description: 'Search across all conversations & data.' },
        ]
    },
    { 
        label: 'Development', 
        view: 'dev_center',
        icon: CodeIcon,
    },
];

const TopHeader = () => {
    const { setActiveView } = useUIState();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

    const handleMenuClick = (view: any) => {
        setActiveView(view);
        setIsMobileMenuOpen(false);
    };

    const toggleSubmenu = (label: string, hasChildren: boolean) => {
        if (window.innerWidth > 1024 || !hasChildren) return;
        setActiveSubmenu(prev => prev === label ? null : label);
    };

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const navWrapper = document.querySelector('.top-header__navigation-wrapper');
        const submenus = navWrapper?.querySelectorAll('.submenu-wrapper');
        
        submenus?.forEach(submenu => {
            const item = submenu.parentElement;
            if (item?.classList.contains('active')) {
                (submenu as HTMLElement).style.maxHeight = `${(submenu as HTMLElement).scrollHeight}px`;
            } else {
                (submenu as HTMLElement).style.maxHeight = '';
            }
        });
    }, [activeSubmenu, isMobileMenuOpen]);

    return (
        <header className="top-header" ref={navRef}>
            <div className="top-header__wrapper">
                <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('dashboard')}} className="top-header__logo">
                    <h2 className="text-xl font-bold text-white">Souly<span className="text-indigo-400">Core</span></h2>
                </a>
                <div className={`top-header__navigation-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
                    <nav>
                        <ul className="top-header__list">
                            {menuConfig.map((item) => (
                                <li key={item.label} className={`top-header__list-item ${activeSubmenu === item.label ? 'active' : ''}`}>
                                    <button onClick={() => item.children ? toggleSubmenu(item.label, true) : handleMenuClick(item.view)}>
                                        <span>{item.label}</span>
                                        {item.children && <ChevronDownIcon className="w-4 h-4 ml-1" />}
                                    </button>
                                    {item.children && (
                                        <div className="submenu-wrapper">
                                            <div className="submenu-title">Features</div>
                                            <ul className="submenu-list">
                                                {item.children.map(child => (
                                                    <li key={child.label}>
                                                        <button className="submenu-list__item-button" onClick={() => handleMenuClick(child.view)}>
                                                            <div className="submenu-list__item-icon">
                                                                <child.icon className="w-5 h-5"/>
                                                            </div>
                                                            <div>
                                                                <span className="submenu-list__item-title">{child.label}</span>
                                                                <span className="submenu-list__item-subtitle">{child.description}</span>
                                                            </div>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                 <div className={`top-header__burger ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <i></i><i></i><i></i>
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
