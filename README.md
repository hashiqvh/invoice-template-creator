# Invoice Template Creator

A powerful Next.js application for creating professional invoice templates using GrapesJS drag-and-drop editor.

## Features

- **Drag & Drop Editor**: Create invoice templates using GrapesJS visual editor
- **Pre-built Invoice Components**: Ready-to-use invoice elements including:
  - Invoice Header
  - Client Information
  - Invoice Table
  - Invoice Totals
  - Payment Information
- **Responsive Design**: Templates work on desktop, tablet, and mobile devices
- **Export Functionality**: Download your templates as HTML files
- **Modern UI**: Clean interface built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invoice-template-creator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Create Invoice Template**: Use the drag-and-drop editor to build your invoice template
2. **Add Components**: Drag invoice-specific components from the sidebar
3. **Customize**: Use the style panel to customize colors, fonts, and layout
4. **Preview**: Switch between desktop, tablet, and mobile views
5. **Export**: Download your completed template as an HTML file

## Available Invoice Components

- **Invoice Header**: Company information and invoice details
- **Client Information**: Bill-to section with client details
- **Invoice Table**: Itemized list with quantities, rates, and amounts
- **Invoice Totals**: Subtotal, tax, and total calculations
- **Payment Information**: Payment terms and contact information

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **GrapesJS**: Visual web page builder
- **GrapesJS Plugins**:
  - grapesjs-preset-webpage
  - grapesjs-blocks-basic
  - grapesjs-plugin-forms
  - grapesjs-plugin-export
  - grapesjs-style-bg
  - grapesjs-style-border
  - grapesjs-style-gradient
  - grapesjs-style-filter

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Font Awesome icons
│   ├── page.tsx            # Main page with invoice editor
│   └── globals.css         # Global styles
└── components/
    └── InvoiceEditor.tsx   # Main GrapesJS editor component
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.