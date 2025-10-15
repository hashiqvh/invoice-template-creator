'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface InvoiceEditorProps {
  onSave?: (html: string, css: string) => void;
  initialContent?: string;
  isPreviewMode?: boolean;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'line' | 'rectangle' | 'circle' | 'header' | 'qr' | 'logo' | 'payment' | 'illustration' | 'richtext';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  style: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textAlign?: 'left' | 'center' | 'right';
    padding?: number;
    backgroundImage?: string;
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    borderRadius?: number;
    opacity?: number;
    fontFamily?: string;
    textDecoration?: string;
    lineHeight?: number;
    letterSpacing?: number;
    boxShadow?: string;
    transform?: string;
  };
  imageUrl?: string;
  groupId?: string;
  qrData?: string;
  logoType?: 'text' | 'image';
}

interface InvoiceData {
  companyName: string;
  companyAddress: string;
  companyCity: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentTerms: string;
  contactEmail: string;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ onSave, isPreviewMode = false }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Removed unused showToolbox state
  const [canvasSize, setCanvasSize] = useState({ width: 794, height: 1123 }); // A4 size at 96 DPI
  const [zoom, setZoom] = useState(1);
  const [savedContent, setSavedContent] = useState<{html: string, css: string} | null>(null);
  const [canvasBackground, setCanvasBackground] = useState({
    color: '#ffffff',
    image: '',
    size: 'cover' as 'cover' | 'contain' | 'auto',
    position: 'center' as 'center' | 'top' | 'bottom' | 'left' | 'right'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Advanced state management
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showLayers, setShowLayers] = useState(false);
  // Removed unused template-related state
  const [tableColumns, setTableColumns] = useState({
    description: true,
    quantity: true,
    rate: true,
    amount: true
  });
  const [tableStyles, setTableStyles] = useState({
    headerTextColor: '#000000',
    headerFontSize: 14,
    headerFontWeight: 'bold',
    cellTextColor: '#333333',
    cellFontSize: 12,
    cellFontWeight: 'normal'
  });
  const [subtotalComponents, setSubtotalComponents] = useState({
    subtotal: true,
    tax: true,
    total: true
  });

  // Default invoice data for template generation
  const [invoiceData] = useState<InvoiceData>({
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street',
    companyCity: 'City, State 12345',
    invoiceNumber: 'INV-001',
    invoiceDate: new Date().toLocaleDateString(),
    clientName: 'Client Company Name',
    clientAddress: '456 Client Avenue',
    clientCity: 'Client City, State 67890',
    items: [
      { id: '1', description: 'Service Description', quantity: 1, rate: 100.00, amount: 100.00 },
      { id: '2', description: 'Additional Service', quantity: 2, rate: 50.00, amount: 100.00 }
    ],
    subtotal: 200.00,
    taxRate: 10,
    taxAmount: 20.00,
    total: 220.00,
    paymentTerms: 'Payment is due within 30 days of invoice date.',
    contactEmail: 'contact@yourcompany.com'
  });

  // Initialize with default invoice template
  useEffect(() => {
    const defaultElements: CanvasElement[] = [
      {
        id: '1',
        type: 'text',
        x: 50,
        y: 50,
        width: 300,
        height: 80,
        content: invoiceData.companyName,
        zIndex: 1,
        locked: false,
        visible: true,
        style: { fontSize: 28, fontWeight: 'bold', color: '#333' }
      },
      {
        id: '2',
        type: 'text',
        x: 50,
        y: 130,
        width: 300,
        height: 60,
        content: `${invoiceData.companyAddress}\n${invoiceData.companyCity}`,
        zIndex: 2,
        locked: false,
        visible: true,
        style: { fontSize: 14, color: '#666' }
      },
      {
        id: '3',
        type: 'text',
        x: 500,
        y: 50,
        width: 250,
        height: 80,
        content: 'INVOICE',
        zIndex: 3,
        locked: false,
        visible: true,
        style: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'right' }
      },
      {
        id: '4',
        type: 'text',
        x: 500,
        y: 130,
        width: 250,
        height: 60,
        content: `Invoice #: ${invoiceData.invoiceNumber}\nDate: ${invoiceData.invoiceDate}`,
        zIndex: 4,
        locked: false,
        visible: true,
        style: { fontSize: 14, color: '#666', textAlign: 'right' }
      },
      {
        id: '5',
        type: 'line',
        x: 50,
        y: 220,
        width: 700,
        height: 2,
        content: '',
        zIndex: 5,
        locked: false,
        visible: true,
        style: { backgroundColor: '#e9ecef' }
      },
      {
        id: '6',
        type: 'text',
        x: 50,
        y: 250,
        width: 200,
        height: 30,
        content: 'Bill To:',
        zIndex: 6,
        locked: false,
        visible: true,
        style: { fontSize: 18, fontWeight: 'bold', color: '#333' }
      },
      {
        id: '7',
        type: 'rectangle',
        x: 50,
        y: 290,
        width: 300,
        height: 100,
        content: '',
        zIndex: 7,
        locked: false,
        visible: true,
        style: { backgroundColor: '#f8f9fa', borderColor: '#dee2e6', borderWidth: 1, padding: 15 }
      },
      {
        id: '8',
        type: 'text',
        x: 65,
        y: 305,
        width: 270,
        height: 70,
        content: `${invoiceData.clientName}\n${invoiceData.clientAddress}\n${invoiceData.clientCity}`,
        zIndex: 8,
        locked: false,
        visible: true,
        style: { fontSize: 14, color: '#333' }
      },
      {
        id: '9',
        type: 'table',
        x: 50,
        y: 420,
        width: 700,
        height: 200,
        content: 'items',
        zIndex: 9,
        locked: false,
        visible: true,
        style: { borderColor: '#dee2e6', borderWidth: 1 }
      },
      {
        id: '10',
        type: 'rectangle',
        x: 500,
        y: 650,
        width: 250,
        height: 120,
        content: '',
        zIndex: 10,
        locked: false,
        visible: true,
        style: { backgroundColor: '#f8f9fa', borderColor: '#dee2e6', borderWidth: 1, padding: 20 }
      },
      {
        id: '11',
        type: 'text',
        x: 520,
        y: 670,
        width: 210,
        height: 80,
        content: `Subtotal: $${invoiceData.subtotal.toFixed(2)}\nTax (${invoiceData.taxRate}%): $${invoiceData.taxAmount.toFixed(2)}\n─────────────────────\nTotal: $${invoiceData.total.toFixed(2)}`,
        zIndex: 11,
        locked: false,
        visible: true,
        style: { fontSize: 14, color: '#333', textAlign: 'right', fontWeight: 'normal' }
      },
      {
        id: '12',
        type: 'rectangle',
        x: 50,
        y: 780,
        width: 700,
        height: 120,
        content: '',
        zIndex: 12,
        locked: false,
        visible: true,
        style: { backgroundColor: '#f8f9fa', borderColor: '#dee2e6', borderWidth: 1, padding: 20 }
      },
      {
        id: '13',
        type: 'text',
        x: 70,
        y: 800,
        width: 660,
        height: 80,
        content: `Payment Information\n${invoiceData.paymentTerms}\nPlease make checks payable to: ${invoiceData.companyName}\nFor questions: ${invoiceData.contactEmail}`,
        zIndex: 13,
        locked: false,
        visible: true,
        style: { fontSize: 14, color: '#666' }
      }
    ];
    setElements(defaultElements);
    // Initialize history with default elements
    setHistory([defaultElements]);
    setHistoryIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElement) {
        deleteElement(selectedElement);
      }
      if (e.key === 'Escape') {
        setSelectedElement(null);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          saveTemplate();
        }
        if (e.key === 'z') {
          e.preventDefault();
          // TODO: Implement undo functionality
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  // Template loading functions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadFintechTemplate = () => {
    saveToHistory();
    const fintechElements: CanvasElement[] = [
      // Header
      {
        id: 'header-1',
        type: 'header',
        x: 50,
        y: 50,
        width: 500,
        height: 120,
        content: 'INVOICE\nPAPERBOT\nFINTECH SOLUTIONS',
        zIndex: 1,
        locked: false,
        visible: true,
        style: {
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1a1a1a',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 20,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.2
        }
      },
      // Logo placeholder
      {
        id: 'logo-1',
        type: 'logo',
        x: 600,
        y: 50,
        width: 80,
        height: 80,
        content: 'P',
        zIndex: 2,
        locked: false,
        visible: true,
        logoType: 'text',
        style: {
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          backgroundColor: '#3b82f6',
          textAlign: 'center',
          padding: 0,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }
      },
      // Client info
      {
        id: 'client-1',
        type: 'text',
        x: 50,
        y: 200,
        width: 300,
        height: 60,
        content: 'CLIENT INFO\nTenex Markets Ltd\nDubai, UAE',
        zIndex: 3,
        locked: false,
        visible: true,
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          color: '#6b7280',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 0,
          lineHeight: 1.4
        }
      },
      // Invoice date
      {
        id: 'date-1',
        type: 'text',
        x: 400,
        y: 200,
        width: 200,
        height: 40,
        content: 'ISSUED DATE\n7 June 2025',
        zIndex: 3,
        locked: false,
        visible: true,
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          color: '#6b7280',
          backgroundColor: 'transparent',
          textAlign: 'right',
          padding: 0,
          lineHeight: 1.4
        }
      },
      // Items table header
      {
        id: 'table-header-1',
        type: 'rectangle',
        x: 50,
        y: 300,
        width: 500,
        height: 40,
        content: '',
        zIndex: 4,
        locked: false,
        visible: true,
        style: {
          backgroundColor: '#1a1a1a',
          borderRadius: 0,
          padding: 0
        }
      },
      // Table header text
      {
        id: 'table-header-text-1',
        type: 'text',
        x: 50,
        y: 300,
        width: 500,
        height: 40,
        content: 'DESCRIPTION                    CHARGES',
        zIndex: 5,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 12,
          lineHeight: 1.2
        }
      },
      // Table item
      {
        id: 'table-item-1',
        type: 'text',
        x: 50,
        y: 340,
        width: 500,
        height: 40,
        content: '# PaperBot Trade Copier\nMonth - June, 2025                    $ 350',
        zIndex: 6,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#1a1a1a',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 12,
          lineHeight: 1.4
        }
      },
      // Total section
      {
        id: 'total-1',
        type: 'rectangle',
        x: 350,
        y: 400,
        width: 200,
        height: 40,
        content: '',
        zIndex: 7,
        locked: false,
        visible: true,
        style: {
          backgroundColor: '#1a1a1a',
          borderRadius: 0,
          padding: 0
        }
      },
      // Total text
      {
        id: 'total-text-1',
        type: 'text',
        x: 350,
        y: 400,
        width: 200,
        height: 40,
        content: 'Total                    $ 350',
        zIndex: 8,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 12,
          lineHeight: 1.2
        }
      },
      // Payment info
      {
        id: 'payment-header-1',
        type: 'rectangle',
        x: 50,
        y: 480,
        width: 500,
        height: 40,
        content: '',
        zIndex: 9,
        locked: false,
        visible: true,
        style: {
          backgroundColor: '#1a1a1a',
          borderRadius: 0,
          padding: 0
        }
      },
      // Payment header text
      {
        id: 'payment-header-text-1',
        type: 'text',
        x: 50,
        y: 480,
        width: 500,
        height: 40,
        content: 'PAYMENT INFO',
        zIndex: 10,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ffffff',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 12,
          lineHeight: 1.2
        }
      },
      // Payment details
      {
        id: 'payment-details-1',
        type: 'text',
        x: 50,
        y: 520,
        width: 500,
        height: 60,
        content: 'Paperbot Fintech Solutions\nWallet ID : TPgazse1uRb4DAAqS6Dg4SF62BMyUae97Y',
        zIndex: 11,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#1a1a1a',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 0,
          lineHeight: 1.4
        }
      },
      // QR Code placeholder
      {
        id: 'qr-1',
        type: 'qr',
        x: 600,
        y: 480,
        width: 100,
        height: 100,
        content: 'QR_CODE',
        zIndex: 12,
        locked: false,
        visible: true,
        qrData: 'TPgazse1uRb4DAAqS6Dg4SF62BMyUae97Y',
        style: {
          backgroundColor: '#f3f4f6',
          borderRadius: 8,
          padding: 8
        }
      }
    ];
    
    setElements(fintechElements);
    setCanvasSize({ width: 800, height: 700 });
    setCanvasBackground({ color: '#ffffff', image: '', size: 'cover', position: 'center' });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadProfessionalTemplate = () => {
    saveToHistory();
    const professionalElements: CanvasElement[] = [
      // Company header
      {
        id: 'company-header-1',
        type: 'header',
        x: 50,
        y: 50,
        width: 400,
        height: 100,
        content: 'Your Company Name\nProfessional Services\n123 Business St, City, State 12345',
        zIndex: 1,
        locked: false,
        visible: true,
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 0,
          lineHeight: 1.3
        }
      },
      // Invoice title
      {
        id: 'invoice-title-1',
        type: 'text',
        x: 500,
        y: 50,
        width: 200,
        height: 60,
        content: 'INVOICE\n#INV-001\nDate: 2025-01-15',
        zIndex: 2,
        locked: false,
        visible: true,
        style: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1f2937',
          backgroundColor: 'transparent',
          textAlign: 'right',
          padding: 0,
          lineHeight: 1.3
        }
      },
      // Client info
      {
        id: 'client-info-1',
        type: 'text',
        x: 50,
        y: 180,
        width: 300,
        height: 80,
        content: 'Bill To:\nClient Company Name\n123 Client Street\nClient City, State 12345',
        zIndex: 3,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#374151',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 0,
          lineHeight: 1.4
        }
      },
      // Invoice table
      {
        id: 'invoice-table-1',
        type: 'table',
        x: 50,
        y: 280,
        width: 500,
        height: 200,
        content: 'items',
        zIndex: 4,
        locked: false,
        visible: true,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          borderWidth: 1,
          padding: 12,
          fontSize: 14
        }
      },
      // Total section
      {
        id: 'total-section-1',
        type: 'text',
        x: 400,
        y: 500,
        width: 150,
        height: 80,
        content: 'Subtotal: $1,200.00\nTax (8%): $96.00\nTotal: $1,296.00',
        zIndex: 5,
        locked: false,
        visible: true,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#1f2937',
          backgroundColor: 'transparent',
          textAlign: 'right',
          padding: 0,
          lineHeight: 1.4
        }
      },
      // Payment terms
      {
        id: 'payment-terms-1',
        type: 'text',
        x: 50,
        y: 600,
        width: 500,
        height: 40,
        content: 'Payment Terms: Net 30 days. Thank you for your business!',
        zIndex: 6,
        locked: false,
        visible: true,
        style: {
          fontSize: 12,
          fontWeight: 'normal',
          color: '#6b7280',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 0,
          lineHeight: 1.4
        }
      }
    ];
    
    setElements(professionalElements);
    setCanvasSize({ width: 650, height: 700 });
    setCanvasBackground({ color: '#ffffff', image: '', size: 'cover', position: 'center' });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadMinimalTemplate = () => {
    saveToHistory();
    const minimalElements: CanvasElement[] = [
      // Simple header
      {
        id: 'minimal-header-1',
        type: 'text',
        x: 50,
        y: 50,
        width: 300,
        height: 40,
        content: 'INVOICE',
        zIndex: 1,
        locked: false,
        visible: true,
        style: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: 'transparent',
          textAlign: 'left',
          padding: 0
        }
      },
      // Simple table
      {
        id: 'minimal-table-1',
        type: 'table',
        x: 50,
        y: 120,
        width: 400,
        height: 150,
        content: 'items',
        zIndex: 2,
        locked: false,
        visible: true,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#000000',
          borderWidth: 1,
          padding: 8,
          fontSize: 12
        }
      },
      // Simple total
      {
        id: 'minimal-total-1',
        type: 'text',
        x: 300,
        y: 290,
        width: 150,
        height: 30,
        content: 'Total: $1,296.00',
        zIndex: 3,
        locked: false,
        visible: true,
        style: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: 'transparent',
          textAlign: 'right',
          padding: 0
        }
      }
    ];
    
    setElements(minimalElements);
    setCanvasSize({ width: 500, height: 400 });
    setCanvasBackground({ color: '#ffffff', image: '', size: 'cover', position: 'center' });
  };

  const addElement = (type: CanvasElement['type']) => {
    const maxZIndex = Math.max(...elements.map(el => el.zIndex), 0);
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type,
      x: snapToGrid ? Math.round(100 / gridSize) * gridSize : 100,
      y: snapToGrid ? Math.round(100 / gridSize) * gridSize : 100,
      width: type === 'text' ? 200 : type === 'line' ? 300 : type === 'image' ? 150 : type === 'header' ? 400 : type === 'qr' ? 100 : type === 'logo' ? 80 : type === 'richtext' ? 300 : 150,
      height: type === 'text' ? 50 : type === 'line' ? 2 : type === 'image' ? 150 : type === 'header' ? 100 : type === 'qr' ? 100 : type === 'logo' ? 80 : type === 'richtext' ? 100 : 100,
      content: type === 'text' ? 'New Text' : type === 'header' ? 'HEADER\nCompany Name\nTagline' : type === 'qr' ? 'QR_CODE' : type === 'logo' ? 'LOGO' : type === 'richtext' ? '<p><strong>Rich Text</strong> with <em>formatting</em> options</p>' : '',
      zIndex: maxZIndex + 1,
      locked: false,
      visible: true,
      style: {
        fontSize: type === 'header' ? 24 : type === 'logo' ? 32 : type === 'richtext' ? 14 : 14,
        fontWeight: type === 'header' ? 'bold' : type === 'logo' ? 'bold' : type === 'richtext' ? 'normal' : 'normal',
        color: type === 'header' ? '#1f2937' : type === 'richtext' ? '#333' : '#333',
        backgroundColor: type === 'rectangle' ? '#f0f0f0' : type === 'image' ? 'transparent' : type === 'logo' ? '#3b82f6' : type === 'richtext' ? 'transparent' : 'transparent',
        borderColor: type === 'image' ? 'transparent' : type === 'richtext' ? 'transparent' : '#ccc',
        borderWidth: type === 'image' ? 0 : type === 'richtext' ? 0 : 1,
        textAlign: type === 'header' ? 'left' : type === 'logo' ? 'center' : type === 'richtext' ? 'left' : 'left',
        padding: type === 'image' ? 0 : type === 'header' ? 20 : type === 'richtext' ? 15 : 10,
        borderRadius: type === 'logo' ? 12 : 0,
        opacity: 1,
        fontFamily: 'Inter, sans-serif',
        textDecoration: 'none',
        lineHeight: 1.4,
        letterSpacing: 0,
        boxShadow: type === 'logo' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
        transform: 'none'
      },
      imageUrl: type === 'image' ? '' : undefined,
      qrData: type === 'qr' ? 'https://example.com/payment' : undefined,
      logoType: type === 'logo' ? 'text' : undefined,
      groupId: undefined
    };
    setElements(prev => {
      const newElements = [...prev, newElement];
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedElement(newElement.id);
  };

  // Update subtotal elements visibility based on settings
  const updateSubtotalVisibility = useCallback(() => {
    setElements(prev => prev.map(element => {
      if (element.content?.includes('Subtotal:')) {
        return { ...element, visible: subtotalComponents.subtotal };
      } else if (element.content?.includes('Tax (')) {
        return { ...element, visible: subtotalComponents.tax };
      } else if (element.content?.includes('Total:') && element.style?.fontWeight === 'bold') {
        return { ...element, visible: subtotalComponents.total };
      }
      return element;
    }));
  }, [subtotalComponents]);

  // Update subtotal visibility when settings change
  useEffect(() => {
    updateSubtotalVisibility();
  }, [subtotalComponents, updateSubtotalVisibility]);

  const addSubtotalSection = () => {
    const containerId = Date.now().toString();
    const subtotalId = (Date.now() + 1).toString();
    const taxId = (Date.now() + 2).toString();
    const separatorId = (Date.now() + 3).toString();
    const totalId = (Date.now() + 4).toString();
    
    const containerElement: CanvasElement = {
      id: containerId,
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 250,
      height: 120,
      content: '',
      zIndex: Math.max(...elements.map(el => el.zIndex), 0) + 1,
      locked: false,
      visible: true,
      style: {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        padding: 20,
        borderRadius: 4
      }
    };
    
    const subtotalElement: CanvasElement = {
      id: subtotalId,
      type: 'text',
      x: 120,
      y: 120,
      width: 210,
      height: 20,
      content: 'Subtotal: $0.00',
      zIndex: Math.max(...elements.map(el => el.zIndex), 0) + 2,
      locked: false,
      visible: subtotalComponents.subtotal,
      style: {
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
        fontWeight: 'normal'
      }
    };
    
    const taxElement: CanvasElement = {
      id: taxId,
      type: 'text',
      x: 120,
      y: 145,
      width: 210,
      height: 20,
      content: 'Tax (10%): $0.00',
      zIndex: Math.max(...elements.map(el => el.zIndex), 0) + 3,
      locked: false,
      visible: subtotalComponents.tax,
      style: {
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
        fontWeight: 'normal'
      }
    };
    
    const separatorElement: CanvasElement = {
      id: separatorId,
      type: 'text',
      x: 120,
      y: 170,
      width: 210,
      height: 20,
      content: '─────────',
      zIndex: Math.max(...elements.map(el => el.zIndex), 0) + 4,
      locked: false,
      visible: true,
      style: {
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
        fontWeight: 'normal'
      }
    };
    
    const totalElement: CanvasElement = {
      id: totalId,
      type: 'text',
      x: 120,
      y: 195,
      width: 210,
      height: 20,
      content: 'Total: $0.00',
      zIndex: Math.max(...elements.map(el => el.zIndex), 0) + 5,
      locked: false,
      visible: subtotalComponents.total,
      style: {
        fontSize: 14,
        color: '#333',
        textAlign: 'right',
        fontWeight: 'bold'
      }
    };
    
    setElements(prev => {
      const newElements = [...prev, containerElement, subtotalElement, taxElement, separatorElement, totalElement];
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedElement(subtotalId);
  };

  // Advanced functions
  const saveToHistory = useCallback((elementsToSave?: CanvasElement[]) => {
    const elementsToStore = elementsToSave || elements;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elementsToStore]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [elements, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const bringToFront = (elementId: string) => {
    const maxZIndex = Math.max(...elements.map(el => el.zIndex), 0);
    updateElementWithHistory(elementId, { zIndex: maxZIndex + 1 });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendToBack = (elementId: string) => {
    const minZIndex = Math.min(...elements.map(el => el.zIndex), 0);
    updateElementWithHistory(elementId, { zIndex: minZIndex - 1 });
  };

  const toggleElementLock = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElementWithHistory(elementId, { locked: !element.locked });
    }
  };

  const toggleElementVisibility = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      updateElementWithHistory(elementId, { visible: !element.visible });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const groupElements = (elementIds: string[]) => {
    const groupId = Date.now().toString();
    setElements(prev => prev.map(el => 
      elementIds.includes(el.id) ? { ...el, groupId } : el
    ));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ungroupElements = (groupId: string) => {
    setElements(prev => prev.map(el => 
      el.groupId === groupId ? { ...el, groupId: undefined } : el
    ));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const alignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElement) return;
    
    const selectedEl = elements.find(el => el.id === selectedElement);
    if (!selectedEl) return;

    const selectedElements = elements.filter(el => el.id === selectedElement);
    if (selectedElements.length === 0) return;

    const bounds = {
      left: Math.min(...selectedElements.map(el => el.x)),
      right: Math.max(...selectedElements.map(el => el.x + el.width)),
      top: Math.min(...selectedElements.map(el => el.y)),
      bottom: Math.max(...selectedElements.map(el => el.y + el.height)),
      centerX: (Math.min(...selectedElements.map(el => el.x)) + Math.max(...selectedElements.map(el => el.x + el.width))) / 2,
      centerY: (Math.min(...selectedElements.map(el => el.y)) + Math.max(...selectedElements.map(el => el.y + el.height))) / 2
    };

    setElements(prev => prev.map(el => {
      if (selectedElements.some(sel => sel.id === el.id)) {
        let newX = el.x;
        let newY = el.y;

        switch (alignment) {
          case 'left':
            newX = bounds.left;
            break;
          case 'center':
            newX = bounds.centerX - el.width / 2;
            break;
          case 'right':
            newX = bounds.right - el.width;
            break;
          case 'top':
            newY = bounds.top;
            break;
          case 'middle':
            newY = bounds.centerY - el.height / 2;
            break;
          case 'bottom':
            newY = bounds.bottom - el.height;
            break;
        }

        return { ...el, x: newX, y: newY };
      }
      return el;
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, elementId?: string) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (elementId) {
          updateElement(elementId, { imageUrl });
        } else {
          // Upload for canvas background
          setCanvasBackground(prev => ({ ...prev, image: imageUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const updateElementWithHistory = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === id ? { ...el, ...updates } : el
      );
      saveToHistory(newElements);
      return newElements;
    });
  };

  const deleteElement = (id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id);
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedElement(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - element.x,
          y: e.clientY - rect.top - element.y
        });
      }
    }
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, elementId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(elementId);
    setIsResizing(true);
    setResizeHandle(handle);
    
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - element.x,
          y: e.clientY - rect.top - element.y
        });
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && selectedElement && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      let newX = (e.clientX - rect.left - dragOffset.x) / zoom;
      let newY = (e.clientY - rect.top - dragOffset.y) / zoom;
      
      // Apply snap-to-grid if enabled
      if (snapToGrid && showGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      
        updateElement(selectedElement, { x: newX, y: newY });
    } else if (isResizing && selectedElement && resizeHandle && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const element = elements.find(el => el.id === selectedElement);
      if (element) {
        let newWidth = element.width;
        let newHeight = element.height;
        let newX = element.x;
        let newY = element.y;
        
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;
        
        switch (resizeHandle) {
          case 'se': // Southeast (bottom-right)
            newWidth = Math.max(20, mouseX - element.x);
            newHeight = Math.max(20, mouseY - element.y);
            break;
          case 'sw': // Southwest (bottom-left)
            newWidth = Math.max(20, element.x + element.width - mouseX);
            newHeight = Math.max(20, mouseY - element.y);
            newX = Math.min(element.x + element.width - 20, mouseX);
            break;
          case 'ne': // Northeast (top-right)
            newWidth = Math.max(20, mouseX - element.x);
            newHeight = Math.max(20, element.y + element.height - mouseY);
            newY = Math.min(element.y + element.height - 20, mouseY);
            break;
          case 'nw': // Northwest (top-left)
            newWidth = Math.max(20, element.x + element.width - mouseX);
            newHeight = Math.max(20, element.y + element.height - mouseY);
            newX = Math.min(element.x + element.width - 20, mouseX);
            newY = Math.min(element.y + element.height - 20, mouseY);
            break;
        }
        
        // Apply snap-to-grid if enabled
        if (snapToGrid && showGrid) {
          newWidth = Math.round(newWidth / gridSize) * gridSize;
          newHeight = Math.round(newHeight / gridSize) * gridSize;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }
        
        updateElement(selectedElement, { 
          x: newX, 
          y: newY,
          width: newWidth,
          height: newHeight
        });
      }
    }
  }, [isDragging, isResizing, selectedElement, dragOffset, zoom, snapToGrid, showGrid, gridSize, resizeHandle, updateElement, elements]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && selectedElement) {
      // Save history when dragging stops
      saveToHistory();
    }
    if (isResizing && selectedElement) {
      // Save history when resizing stops
      saveToHistory();
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, [isDragging, isResizing, selectedElement, saveToHistory]);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const renderElement = (element: CanvasElement) => {
    if (element.type === 'text') {
      return (
        <div
          style={{
            fontSize: element.style?.fontSize || 14,
            fontWeight: element.style?.fontWeight || 'normal',
            fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
            color: element.style?.color || '#333',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: (element.style?.borderWidth && element.style.borderWidth > 0) ? `${element.style.borderWidth}px solid ${element.style?.borderColor || '#000'}` : 'none',
            textAlign: element.style?.textAlign || 'left',
            padding: `${element.style?.padding || 0}px`,
            borderRadius: `${element.style?.borderRadius || 0}px`,
            opacity: element.style?.opacity || 1,
            boxSizing: 'border-box',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            lineHeight: element.style?.lineHeight || 1.4
          }}
        >
          {element.content}
          </div>
      );
    } else if (element.type === 'header') {
      return (
        <div
          style={{
            fontSize: element.style?.fontSize || 24,
            fontWeight: element.style?.fontWeight || 'bold',
            color: element.style?.color || '#1f2937',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: (element.style?.borderWidth && element.style.borderWidth > 0) ? `${element.style.borderWidth}px solid ${element.style?.borderColor || '#000'}` : 'none',
            textAlign: element.style?.textAlign || 'left',
            padding: `${element.style?.padding || 20}px`,
            borderRadius: `${element.style?.borderRadius || 0}px`,
            opacity: element.style?.opacity || 1,
            boxSizing: 'border-box',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
            lineHeight: element.style?.lineHeight || 1.3
          }}
        >
          {element.content.split('\n').map((line, i) => (
            <div key={i} style={{ marginBottom: i === 0 ? '8px' : '4px' }}>
              {line}
          </div>
          ))}
        </div>
      );
    } else if (element.type === 'logo') {
      return (
        <div
          style={{
            fontSize: element.style?.fontSize || 32,
            fontWeight: element.style?.fontWeight || 'bold',
            color: element.style?.color || '#ffffff',
            backgroundColor: element.style?.backgroundColor || '#3b82f6',
            border: (element.style?.borderWidth && element.style.borderWidth > 0) ? `${element.style.borderWidth}px solid ${element.style?.borderColor || '#000'}` : 'none',
            textAlign: element.style?.textAlign || 'center',
            padding: `${element.style?.padding || 0}px`,
            borderRadius: `${element.style?.borderRadius || 12}px`,
            opacity: element.style?.opacity || 1,
            boxSizing: 'border-box',
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
            boxShadow: element.style?.boxShadow || '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          {element.content}
          </div>
      );
    } else if (element.type === 'qr') {
      return (
        <div
          style={{
            backgroundColor: element.style?.backgroundColor || '#f3f4f6',
            border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#d1d5db'}`,
            borderRadius: `${element.style?.borderRadius || 8}px`,
            padding: `${element.style?.padding || 8}px`,
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#000000',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            gap: '1px',
            padding: '4px'
          }}>
            {Array.from({ length: 64 }, (_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: Math.random() > 0.5 ? '#000000' : '#ffffff',
                  width: '100%',
                  height: '100%'
                }}
              />
            ))}
        </div>
          <div style={{
            fontSize: '8px',
            color: '#6b7280',
            marginTop: '4px',
            textAlign: 'center'
          }}>
            QR Code
          </div>
        </div>
      );
    } else if (element.type === 'image') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: element.imageUrl ? `url('${element.imageUrl}')` : 'none',
            backgroundSize: element.style?.backgroundSize || 'cover',
            backgroundPosition: element.style?.backgroundPosition || 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: element.imageUrl ? 'transparent' : '#f8fafc',
            border: element.imageUrl ? 'none' : '2px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: '500',
            cursor: element.imageUrl ? 'default' : 'pointer'
          }}
          onClick={(e) => {
            // Only trigger upload if no image is loaded
            if (!element.imageUrl) {
              e.stopPropagation();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>, element.id);
              input.click();
            }
          }}
        >
          {!element.imageUrl && '🖼️ Click to upload image'}
        </div>
      );
    } else if (element.type === 'table') {
      return (
        <table style={{ 
          width: '100%', 
          height: '100%',
          borderCollapse: 'collapse',
          backgroundColor: element.style?.backgroundColor || '#f8f9fa'
        }}>
          <thead>
            <tr>
              {tableColumns.description && (
                <th style={{ 
                  padding: `${element.style?.padding || 12}px`, 
                  border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                  textAlign: 'left',
                  fontWeight: tableStyles.headerFontWeight,
                  fontSize: `${tableStyles.headerFontSize}px`,
                  color: tableStyles.headerTextColor
                }}>Description</th>
              )}
              {tableColumns.quantity && (
                <th style={{ 
                  padding: `${element.style?.padding || 12}px`, 
                  border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                  textAlign: 'center',
                  fontWeight: tableStyles.headerFontWeight,
                  fontSize: `${tableStyles.headerFontSize}px`,
                  color: tableStyles.headerTextColor
                }}>Quantity</th>
              )}
              {tableColumns.rate && (
                <th style={{ 
                  padding: `${element.style?.padding || 12}px`, 
                  border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                  textAlign: 'right',
                  fontWeight: tableStyles.headerFontWeight,
                  fontSize: `${tableStyles.headerFontSize}px`,
                  color: tableStyles.headerTextColor
                }}>Rate</th>
              )}
              {tableColumns.amount && (
                <th style={{ 
                  padding: `${element.style?.padding || 12}px`, 
                  border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                  textAlign: 'right',
                  fontWeight: tableStyles.headerFontWeight,
                  fontSize: `${tableStyles.headerFontSize}px`,
                  color: tableStyles.headerTextColor
                }}>Amount</th>
              )}
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map(item => (
              <tr key={item.id}>
                {tableColumns.description && (
                  <td style={{ 
                    padding: `${element.style?.padding || 12}px`, 
                    border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`,
                    color: tableStyles.cellTextColor,
                    fontSize: `${tableStyles.cellFontSize}px`,
                    fontWeight: tableStyles.cellFontWeight
                  }}>{item.description}</td>
                )}
                {tableColumns.quantity && (
                  <td style={{ 
                    padding: `${element.style?.padding || 12}px`, 
                    border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                    textAlign: 'center',
                    color: tableStyles.cellTextColor,
                    fontSize: `${tableStyles.cellFontSize}px`,
                    fontWeight: tableStyles.cellFontWeight
                  }}>{item.quantity}</td>
                )}
                {tableColumns.rate && (
                  <td style={{ 
                    padding: `${element.style?.padding || 12}px`, 
                    border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                    textAlign: 'right',
                    color: tableStyles.cellTextColor,
                    fontSize: `${tableStyles.cellFontSize}px`,
                    fontWeight: tableStyles.cellFontWeight
                  }}>${item.rate.toFixed(2)}</td>
                )}
                {tableColumns.amount && (
                  <td style={{ 
                    padding: `${element.style?.padding || 12}px`, 
                    border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`, 
                    textAlign: 'right',
                    color: tableStyles.cellTextColor,
                    fontSize: `${tableStyles.cellFontSize}px`,
                    fontWeight: tableStyles.cellFontWeight
                  }}>${item.amount.toFixed(2)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (element.type === 'rectangle') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: element.style?.backgroundColor || '#e9ecef',
            border: `${element.style?.borderWidth || 1}px solid ${element.style?.borderColor || '#dee2e6'}`,
            borderRadius: `${element.style?.borderRadius || 4}px`,
            opacity: element.style?.opacity || 1
          }}
        />
      );
    } else if (element.type === 'line') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderTop: `${element.style?.borderWidth || 2}px solid ${element.style?.borderColor || '#dee2e6'}`,
            opacity: element.style?.opacity || 1
          }}
        />
      );
    } else if (element.type === 'richtext') {
      return (
        <div
          style={{
            fontSize: element.style?.fontSize || 14,
            fontWeight: element.style?.fontWeight || 'normal',
            fontFamily: element.style?.fontFamily || 'Inter, sans-serif',
            color: element.style?.color || '#333',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: (element.style?.borderWidth && element.style.borderWidth > 0) ? `${element.style.borderWidth}px solid ${element.style?.borderColor || '#000'}` : 'none',
            textAlign: element.style?.textAlign || 'left',
            padding: `${element.style?.padding || 15}px`,
            borderRadius: `${element.style?.borderRadius || 0}px`,
            opacity: element.style?.opacity || 1,
            boxSizing: 'border-box',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            lineHeight: element.style?.lineHeight || 1.5,
            overflow: 'hidden'
          }}
          dangerouslySetInnerHTML={{ __html: element.content }}
        />
      );
    }
    return null;
  };

  const downloadAsPDF = () => {
    const htmlContent = generateHTML();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Wait for content to load, then trigger print
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
  };

  const generateHTML = () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice Template</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .invoice-container {
            background: ${canvasBackground.image ? `url('${canvasBackground.image}')` : canvasBackground.color};
            background-size: ${canvasBackground.size};
            background-position: ${canvasBackground.position};
            background-repeat: no-repeat;
            width: ${canvasSize.width}px;
            height: ${canvasSize.height}px;
            position: relative;
            margin: 0 auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          ${elements.map(el => `
            .element-${el.id} {
              position: absolute;
              left: ${el.x}px;
              top: ${el.y}px;
              width: ${el.width}px;
              height: ${el.height}px;
              font-size: ${el.style.fontSize || 14}px;
              font-weight: ${el.style.fontWeight || 'normal'};
              color: ${el.style.color || '#333'};
              background-color: ${el.style.backgroundColor || 'transparent'};
              background-image: ${el.style.backgroundImage ? `url('${el.style.backgroundImage}')` : 'none'};
              background-size: ${el.style.backgroundSize || 'cover'};
              background-position: ${el.style.backgroundPosition || 'center'};
              background-repeat: no-repeat;
              border: ${el.style.borderWidth || 0}px solid ${el.style.borderColor || 'transparent'};
              text-align: ${el.style.textAlign || 'left'};
              padding: ${el.style.padding || 0}px;
              border-radius: ${el.style.borderRadius || 0}px;
              opacity: ${el.style.opacity || 1};
              box-sizing: border-box;
              ${el.type === 'line' ? 'border-top: 2px solid #e9ecef;' : ''}
              ${el.type === 'rectangle' ? 'border-radius: 4px;' : ''}
              ${el.type === 'image' && el.imageUrl ? `background-image: url('${el.imageUrl}'); background-size: cover; background-position: center;` : ''}
            }
          `).join('\n')}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${elements.map(el => {
            if (el.type === 'text') {
              return `<div class="element-${el.id}">${el.content.replace(/\n/g, '<br>')}</div>`;
            } else if (el.type === 'image') {
              return `<div class="element-${el.id}"></div>`;
            } else if (el.type === 'rectangle') {
              return `<div class="element-${el.id}"></div>`;
            } else if (el.type === 'line') {
              return `<div class="element-${el.id}"></div>`;
            } else if (el.type === 'table' && el.content === 'items') {
              return `
                <div class="element-${el.id}">
                  <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">Description</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">Quantity</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Rate</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
                      ${invoiceData.items.map(item => `
                        <tr>
                          <td style="padding: 12px; border: 1px solid #dee2e6;">${item.description}</td>
                          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
                          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">$${item.rate.toFixed(2)}</td>
                          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">$${item.amount.toFixed(2)}</td>
              </tr>
                      `).join('')}
            </tbody>
          </table>
        </div>
              `;
            }
            return '';
          }).join('')}
            </div>
      </body>
      </html>
    `;
    return html;
  };

  const saveTemplate = () => {
    const html = generateHTML();
    setSavedContent({ html, css: '' });
    if (onSave) {
      onSave(html, '');
    }
  };

  // JSON-based data persistence
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveTemplateToJSON = () => {
    const templateData = {
      id: `template-${Date.now()}`,
      name: 'Invoice Template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvasSize,
      canvasBackground,
      elements: elements.map(el => ({
        ...el,
        // Ensure all style properties are included
        style: {
          fontSize: el.style?.fontSize || 14,
          fontWeight: el.style?.fontWeight || 'normal',
          color: el.style?.color || '#333',
          backgroundColor: el.style?.backgroundColor || 'transparent',
          borderColor: el.style?.borderColor || 'transparent',
          borderWidth: el.style?.borderWidth || 0,
          textAlign: el.style?.textAlign || 'left',
          padding: el.style?.padding || 0,
          borderRadius: el.style?.borderRadius || 0,
          opacity: el.style?.opacity || 1,
          fontFamily: el.style?.fontFamily || 'Inter, sans-serif',
          textDecoration: el.style?.textDecoration || 'none',
          lineHeight: el.style?.lineHeight || 1.4,
          letterSpacing: el.style?.letterSpacing || 0,
          boxShadow: el.style?.boxShadow || 'none',
          transform: el.style?.transform || 'none',
          backgroundImage: el.style?.backgroundImage || 'none',
          backgroundSize: el.style?.backgroundSize || 'auto',
          backgroundPosition: el.style?.backgroundPosition || 'center'
        }
      })),
      invoiceData
    };

    const jsonString = JSON.stringify(templateData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-template-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadTemplateFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templateData = JSON.parse(e.target?.result as string);
        
        if (templateData.canvasSize) setCanvasSize(templateData.canvasSize);
        if (templateData.canvasBackground) setCanvasBackground(templateData.canvasBackground);
        if (templateData.elements) {
          saveToHistory();
          setElements(templateData.elements);
        }
        // Note: invoiceData is not a state variable, so we skip updating it
      } catch (error) {
        console.error('Error loading template:', error);
        alert('Error loading template. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportTemplateData = () => {
    const templateData = {
      id: `template-${Date.now()}`,
      name: 'Invoice Template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvasSize,
      canvasBackground,
      elements,
      invoiceData,
      metadata: {
        version: '1.0',
        createdBy: 'Invoice Designer Pro',
        description: 'Professional invoice template'
      }
    };

    return templateData;
  };

  if (isPreviewMode && savedContent) {
  return (
      <div className="h-full bg-white">
        <div className="h-full overflow-auto p-8">
          <div 
            className="max-w-4xl mx-auto bg-white shadow-lg p-8"
            dangerouslySetInnerHTML={{ __html: savedContent.html }}
          />
            </div>
            </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Frappe-style Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Print Designer</h2>
            <button
              onClick={downloadAsPDF}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
              title="Download as PDF"
            >
              <span>📄</span>
              <span>PDF</span>
            </button>
          </div>
          <p className="text-xs text-gray-600">Invoice Template</p>
        </div>

        {/* Toolbar Section */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Tools</h3>
          
          {/* History Controls */}
          <div className="flex space-x-1 mb-3">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
              </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
              </button>
          </div>

          {/* Grid Controls */}
          <div className="flex items-center space-x-2 mb-3">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 text-xs rounded ${showGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              title="Toggle grid"
            >
              ⊞ Grid
              </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`px-2 py-1 text-xs rounded ${snapToGrid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              title="Snap to grid"
            >
              🧲 Snap
            </button>
            <input
              type="number"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value) || 20)}
              className="w-12 px-1 py-1 text-xs border border-gray-300 rounded"
              title="Grid size"
            />
        </div>

          {/* Clear Canvas */}
          <div className="mb-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all elements?')) {
                  saveToHistory();
                  setElements([]);
                  setSelectedElement(null);
                }
              }}
              className="w-full px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Clear all elements"
            >
              🗑️ Clear Canvas
            </button>
          </div>
          </div>

        {/* Table Settings - Only show when table element is selected */}
        {selectedElement && elements.find(el => el.id === selectedElement)?.type === 'table' && (
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Table Columns</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Description</label>
                <input
                  type="checkbox"
                  checked={tableColumns.description}
                  onChange={(e) => setTableColumns(prev => ({ ...prev, description: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Quantity</label>
                <input
                  type="checkbox"
                  checked={tableColumns.quantity}
                  onChange={(e) => setTableColumns(prev => ({ ...prev, quantity: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Rate</label>
                <input
                  type="checkbox"
                  checked={tableColumns.rate}
                  onChange={(e) => setTableColumns(prev => ({ ...prev, rate: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Amount</label>
                <input
                  type="checkbox"
                  checked={tableColumns.amount}
                  onChange={(e) => setTableColumns(prev => ({ ...prev, amount: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Styling - Only show when table element is selected */}
        {selectedElement && elements.find(el => el.id === selectedElement)?.type === 'table' && (
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Table Styling</h3>
            <div className="space-y-3">
              {/* Header Styles */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Header</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={tableStyles.headerTextColor}
                        onChange={(e) => setTableStyles(prev => ({ ...prev, headerTextColor: e.target.value }))}
                        className="w-6 h-6 border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-500">{tableStyles.headerTextColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={tableStyles.headerFontSize}
                      onChange={(e) => setTableStyles(prev => ({ ...prev, headerFontSize: parseInt(e.target.value) || 14 }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                    <select
                      value={tableStyles.headerFontWeight}
                      onChange={(e) => setTableStyles(prev => ({ ...prev, headerFontWeight: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                      <option value="600">Semi Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cell Styles */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Content</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={tableStyles.cellTextColor}
                        onChange={(e) => setTableStyles(prev => ({ ...prev, cellTextColor: e.target.value }))}
                        className="w-6 h-6 border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-500">{tableStyles.cellTextColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={tableStyles.cellFontSize}
                      onChange={(e) => setTableStyles(prev => ({ ...prev, cellFontSize: parseInt(e.target.value) || 12 }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                    <select
                      value={tableStyles.cellFontWeight}
                      onChange={(e) => setTableStyles(prev => ({ ...prev, cellFontWeight: e.target.value }))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Light</option>
                      <option value="600">Semi Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subtotal Settings - Only show when subtotal elements are selected */}
        {selectedElement && elements.find(el => el.id === selectedElement)?.content?.includes('Subtotal:') && (
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Subtotal Components</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Subtotal</label>
                <input
                  type="checkbox"
                  checked={subtotalComponents.subtotal}
                  onChange={(e) => setSubtotalComponents(prev => ({ ...prev, subtotal: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Tax</label>
                <input
                  type="checkbox"
                  checked={subtotalComponents.tax}
                  onChange={(e) => setSubtotalComponents(prev => ({ ...prev, tax: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">Total</label>
                <input
                  type="checkbox"
                  checked={subtotalComponents.total}
                  onChange={(e) => setSubtotalComponents(prev => ({ ...prev, total: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Elements Section */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Elements</h3>
          <div className="space-y-1">
            <button
              onClick={() => addElement('text')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add text element"
            >
              <span className="mr-2 text-sm">📝</span>
              Text
              </button>
            <button
              onClick={() => addElement('richtext')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add rich text element"
            >
              <span className="mr-2 text-sm">📄</span>
              Rich Text
              </button>
            <button
              onClick={() => addElement('image')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add image element"
            >
              <span className="mr-2 text-sm">🖼️</span>
              Image
            </button>
            <button
              onClick={() => addElement('rectangle')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add rectangle shape"
            >
              <span className="mr-2 text-sm">⬜</span>
              Shape
            </button>
            <button
              onClick={() => addElement('line')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add line separator"
            >
              <span className="mr-2 text-sm">➖</span>
              Line
            </button>
            <button
              onClick={() => addElement('table')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add invoice table"
            >
              <span className="mr-2 text-sm">📊</span>
              Invoice Table
            </button>
            <button
              onClick={() => addSubtotalSection()}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add professional subtotal section"
            >
              <span className="mr-2 text-sm">💰</span>
              Subtotal Section
            </button>
            <button
              onClick={() => addElement('header')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add professional header"
            >
              <span className="mr-2 text-sm">🏢</span>
              Header
            </button>
            <button
              onClick={() => addElement('qr')}
              className="w-full flex items-center px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
              title="Add QR code"
            >
              <span className="mr-2 text-sm">📱</span>
              QR Code
              </button>
            </div>
          </div>

        {/* Canvas Background */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Page Settings</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Page Size</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="number"
                    value={canvasSize.width}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="number"
                    value={canvasSize.height}
                    onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 1000 }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Background Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={canvasBackground.color}
                  onChange={(e) => setCanvasBackground(prev => ({ ...prev, color: e.target.value }))}
                  className="w-6 h-6 border border-gray-300 rounded"
                />
                <span className="text-xs text-gray-500">{canvasBackground.color}</span>
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Upload Background
              </button>
              {canvasBackground.image && (
                <button
                  onClick={() => setCanvasBackground(prev => ({ ...prev, image: '' }))}
                  className="w-full mt-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Remove Background
              </button>
              )}
            </div>
            {canvasBackground.image && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Image Size</label>
                  <select
                    value={canvasBackground.size}
                    onChange={(e) => setCanvasBackground(prev => ({ ...prev, size: e.target.value as 'cover' | 'contain' | 'auto' }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Image Position</label>
                  <select
                    value={canvasBackground.position}
                    onChange={(e) => setCanvasBackground(prev => ({ ...prev, position: e.target.value as 'left' | 'center' | 'right' }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}
          </div>
          </div>

        {/* Layers Panel */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Layers</h3>
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showLayers ? 'Hide' : 'Show'}
              </button>
            </div>

          {showLayers && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {elements
                .sort((a, b) => b.zIndex - a.zIndex)
                .map(element => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-1 rounded text-xs ${
                      selectedElement === element.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {element.type === 'text' ? '📝' : 
                         element.type === 'richtext' ? '📄' :
                         element.type === 'image' ? '🖼️' : 
                         element.type === 'table' ? '📊' : 
                         element.type === 'rectangle' ? '⬜' : '➖'}
                      </span>
                      <span className="truncate">{element.content || element.type}</span>
          </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleElementVisibility(element.id)}
                        className={`text-xs ${element.visible ? 'text-green-600' : 'text-gray-400'}`}
                        title={element.visible ? 'Hide' : 'Show'}
                      >
                        {element.visible ? '👁️' : '🙈'}
                      </button>
                      <button
                        onClick={() => toggleElementLock(element.id)}
                        className={`text-xs ${element.locked ? 'text-red-600' : 'text-gray-400'}`}
                        title={element.locked ? 'Unlock' : 'Lock'}
                      >
                        {element.locked ? '🔒' : '🔓'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
          </div>

        {/* Properties Panel */}
        {selectedElement && (
          <div className="flex-1 p-3">
            <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Properties</h3>
            {(() => {
              const element = elements.find(el => el.id === selectedElement);
              if (!element) return null;

              return (
                <div className="space-y-3">
                  {element.type === 'header' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Header Content</label>
                        <textarea
                          value={element.content}
                          onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                          placeholder="Enter header text (use \n for line breaks)"
                        />
          </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          step="2"
                          value={element.style.fontSize || 24}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, fontSize: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.fontSize || 24}px</div>
          </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                        <select
                          value={element.style.fontFamily || 'Inter, sans-serif'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, fontFamily: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="Helvetica, sans-serif">Helvetica</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="Times New Roman, serif">Times New Roman</option>
                          <option value="Courier New, monospace">Courier New</option>
                          <option value="Verdana, sans-serif">Verdana</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                        </select>
          </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                        <select
                          value={element.style.fontWeight || 'bold'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, fontWeight: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="normal">Normal (400)</option>
                          <option value="bold">Bold (700)</option>
                          <option value="lighter">Light (300)</option>
                          <option value="100">100 - Thin</option>
                          <option value="200">200 - Extra Light</option>
                          <option value="300">300 - Light</option>
                          <option value="400">400 - Normal</option>
                          <option value="500">500 - Medium</option>
                          <option value="600">600 - Semi Bold</option>
                          <option value="700">700 - Bold</option>
                          <option value="800">800 - Extra Bold</option>
                          <option value="900">900 - Black</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={element.style.color || '#1f2937'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, color: e.target.value }
                            })}
                            className="w-8 h-6 border border-gray-300 rounded"
                          />
                          <select
                            value={element.style.color || '#1f2937'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, color: e.target.value }
                            })}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="#1f2937">Dark Gray</option>
                            <option value="#000000">Black</option>
                            <option value="#374151">Medium Gray</option>
                            <option value="#6b7280">Light Gray</option>
                            <option value="#3b82f6">Blue</option>
                            <option value="#059669">Green</option>
                            <option value="#dc2626">Red</option>
                            <option value="#7c3aed">Purple</option>
                          </select>
          </div>
        </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Text Alignment</label>
                        <select
                          value={element.style.textAlign || 'left'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, textAlign: e.target.value as 'left' | 'center' | 'right' }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
        </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Line Height</label>
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={element.style.lineHeight || 1.3}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, lineHeight: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.lineHeight || 1.3}</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Letter Spacing</label>
                        <input
                          type="range"
                          min="-2"
                          max="5"
                          step="0.5"
                          value={element.style.letterSpacing || 0}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, letterSpacing: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.letterSpacing || 0}px</div>
                      </div>
                    </div>
                  )}

                  {element.type === 'text' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Text Content</label>
                        <textarea
                          value={element.content}
                          onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                          placeholder="Enter your text content"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                        <input
                          type="range"
                          min="8"
                          max="32"
                          step="1"
                          value={element.style.fontSize || 14}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, fontSize: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.fontSize || 14}px</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                        <select
                          value={element.style.fontFamily || 'Inter, sans-serif'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, fontFamily: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="Helvetica, sans-serif">Helvetica</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="Times New Roman, serif">Times New Roman</option>
                          <option value="Courier New, monospace">Courier New</option>
                          <option value="Verdana, sans-serif">Verdana</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                        <select
                          value={element.style.fontWeight || 'normal'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, fontWeight: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="normal">Normal (400)</option>
                          <option value="bold">Bold (700)</option>
                          <option value="lighter">Light (300)</option>
                          <option value="100">100 - Thin</option>
                          <option value="200">200 - Extra Light</option>
                          <option value="300">300 - Light</option>
                          <option value="400">400 - Normal</option>
                          <option value="500">500 - Medium</option>
                          <option value="600">600 - Semi Bold</option>
                          <option value="700">700 - Bold</option>
                          <option value="800">800 - Extra Bold</option>
                          <option value="900">900 - Black</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={element.style.color || '#333'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, color: e.target.value }
                            })}
                            className="w-8 h-6 border border-gray-300 rounded"
                          />
                          <select
                            value={element.style.color || '#333'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, color: e.target.value }
                            })}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="#333333">Dark Gray</option>
                            <option value="#000000">Black</option>
                            <option value="#666666">Medium Gray</option>
                            <option value="#999999">Light Gray</option>
                            <option value="#3b82f6">Blue</option>
                            <option value="#059669">Green</option>
                            <option value="#dc2626">Red</option>
                            <option value="#7c3aed">Purple</option>
                            <option value="#f59e0b">Orange</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Text Alignment</label>
                        <select
                          value={element.style.textAlign || 'left'}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, textAlign: e.target.value as 'left' | 'center' | 'right' }
                          })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Line Height</label>
                        <input
                          type="range"
                          min="1"
                          max="2"
                          step="0.1"
                          value={element.style.lineHeight || 1.4}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, lineHeight: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.lineHeight || 1.4}</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Letter Spacing</label>
                        <input
                          type="range"
                          min="-1"
                          max="3"
                          step="0.5"
                          value={element.style.letterSpacing || 0}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, letterSpacing: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.letterSpacing || 0}px</div>
                      </div>
                    </div>
                  )}
                  
                  {element.type === 'richtext' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Rich Text Content</label>
                      <textarea
                        value={element.content}
                        onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        placeholder="Enter HTML content (e.g., &lt;p&gt;&lt;strong&gt;Bold text&lt;/strong&gt;&lt;/p&gt;)"
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        <p className="mb-1">HTML formatting examples:</p>
                        <div className="space-y-1 text-xs">
                          <div><code>&lt;strong&gt;Bold text&lt;/strong&gt;</code></div>
                          <div><code>&lt;em&gt;Italic text&lt;/em&gt;</code></div>
                          <div><code>&lt;u&gt;Underlined text&lt;/u&gt;</code></div>
                          <div><code>&lt;p&gt;Paragraph&lt;/p&gt;</code></div>
                          <div><code>&lt;br/&gt;</code> (line break)</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {element.type === 'image' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, selectedElement)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      {element.imageUrl && (
                        <button
                          onClick={() => updateElement(selectedElement, { imageUrl: '' })}
                          className="w-full mt-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  )}

                  {element.type === 'table' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Table Background</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={element.style.backgroundColor || '#f8f9fa'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, backgroundColor: e.target.value }
                            })}
                            className="w-8 h-6 border border-gray-300 rounded"
                          />
                          <select
                            value={element.style.backgroundColor || '#f8f9fa'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, backgroundColor: e.target.value }
                            })}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="#f8f9fa">Light Gray</option>
                            <option value="#e9ecef">Medium Gray</option>
                            <option value="#dee2e6">Dark Gray</option>
                            <option value="#ffffff">White</option>
                            <option value="#007bff">Blue</option>
                            <option value="#28a745">Green</option>
                            <option value="#ffc107">Yellow</option>
                            <option value="#dc3545">Red</option>
                            <option value="#6f42c1">Purple</option>
                            <option value="transparent">Transparent</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Border Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={element.style.borderColor || '#dee2e6'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, borderColor: e.target.value }
                            })}
                            className="w-8 h-6 border border-gray-300 rounded"
                          />
                          <select
                            value={element.style.borderColor || '#dee2e6'}
                            onChange={(e) => updateElement(selectedElement, { 
                              style: { ...element.style, borderColor: e.target.value }
                            })}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="#dee2e6">Light Gray</option>
                            <option value="#adb5bd">Medium Gray</option>
                            <option value="#6c757d">Dark Gray</option>
                            <option value="#000000">Black</option>
                            <option value="#007bff">Blue</option>
                            <option value="#28a745">Green</option>
                            <option value="transparent">No Border</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Border Width</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="1"
                          value={element.style.borderWidth || 1}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, borderWidth: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.borderWidth || 1}px</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cell Padding</label>
                        <input
                          type="range"
                          min="4"
                          max="24"
                          step="2"
                          value={element.style.padding || 12}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, padding: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.padding || 12}px</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          step="1"
                          value={element.style.borderRadius || 0}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, borderRadius: parseInt(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.style.borderRadius || 0}px</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Table Width</label>
                        <input
                          type="range"
                          min="200"
                          max="800"
                          step="20"
                          value={element.width}
                          onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.width}px</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Table Height</label>
                        <input
                          type="range"
                          min="100"
                          max="600"
                          step="20"
                          value={element.height}
                          onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{element.height}px</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={element.style.opacity || 1}
                          onChange={(e) => updateElement(selectedElement, { 
                            style: { ...element.style, opacity: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{Math.round((element.style.opacity || 1) * 100)}%</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">X</label>
                      <input
                        type="number"
                        value={element.x}
                        onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Y</label>
                      <input
                        type="number"
                        value={element.y}
                        onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        value={element.width}
                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        value={element.height}
                        onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={element.style.backgroundColor || '#ffffff'}
                        onChange={(e) => updateElement(selectedElement, { 
                          style: { ...element.style, backgroundColor: e.target.value }
                        })}
                        className="w-8 h-6 border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-500">{element.style.backgroundColor || '#ffffff'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={element.style.opacity || 1}
                      onChange={(e) => updateElement(selectedElement, { 
                        style: { ...element.style, opacity: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">{(element.style.opacity || 1) * 100}%</div>
                  </div>

                  <button
                    onClick={() => deleteElement(selectedElement)}
                    className="w-full px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete Element
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

        {/* Frappe-style Canvas Area */}
        <div className="flex-1 bg-gray-100 p-4 overflow-auto h-full">
          <div className="flex justify-center items-start h-full">
          <div className="relative">
            {/* Canvas Container */}
            <div
              ref={canvasRef}
              className="relative bg-white shadow-lg border border-gray-300"
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                backgroundColor: canvasBackground.color,
                backgroundImage: canvasBackground.image ? `url(${canvasBackground.image})` : 'none',
                backgroundSize: canvasBackground.size,
                backgroundPosition: canvasBackground.position,
                backgroundRepeat: 'no-repeat',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'canvas')}
            >
              {/* Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-10" style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                  backgroundPosition: '0 0'
                }}></div>
              )}

              {/* Page Alignment Guides */}
              <div className="absolute inset-0 pointer-events-none z-5">
                {/* Center vertical line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-blue-300 transform -translate-x-0.5"></div>
                {/* Center horizontal line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-300 transform -translate-y-0.5"></div>
                {/* Margin lines */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="absolute right-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-300"></div>
                <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-gray-300"></div>
              </div>

              {/* Render Elements */}
              {elements.map(element => (
                <div
                  key={element.id}
                  className={`absolute cursor-move select-none ${
                    selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                  } ${!element.visible ? 'opacity-50' : ''}`}
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    zIndex: element.zIndex,
                    pointerEvents: element.locked ? 'none' : 'auto'
                  }}
                  onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                    handleMouseDown(e, element.id);
                  }}
                >
                  {renderElement(element)}
                  
                  {/* Resize Handles */}
                  {selectedElement === element.id && !element.locked && (
                    <>
                      {/* Corner handles */}
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-nw-resize"
                        style={{ top: '-6px', left: '-6px' }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize"
                        style={{ top: '-6px', right: '-6px' }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize"
                        style={{ bottom: '-6px', left: '-6px' }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                      />
                      <div
                        className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize"
                        style={{ bottom: '-6px', right: '-6px' }}
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                      />
                      
                      {/* Dimension display */}
                      <div className="absolute -bottom-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {Math.round(element.width)} × {Math.round(element.height)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 bg-white border border-gray-300 rounded shadow-sm p-1">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded text-xs"
                  title="Zoom out"
                >
                  −
                </button>
                <span className="text-xs text-gray-700 min-w-[2.5rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded text-xs"
                  title="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;