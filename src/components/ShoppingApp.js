import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Upload, Moon, Sun } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

const ShoppingApp = () => {
  // Stati per il tema
  const [isDark, setIsDark] = useState(false);
  
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Altri stati
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const BUDGET = 260;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      let headerIndex = jsonData.findIndex(row => row[0] === 'CODICE');
      if (headerIndex === -1) throw new Error('Intestazioni non trovate');

      const data = jsonData
        .slice(headerIndex + 1)
        .filter(row => row[0] && row[1] && !String(row[1]).toLowerCase().includes('promo'))
        .map(row => ({
          code: row[0].toString(),
          product: row[1],
          price: typeof row[4] === 'number' ? row[4] : 
                 parseFloat(String(row[4]).replace('€', '').replace(',', '.'))
        }))
        .filter(item => !isNaN(item.price));

      setProducts(data);
    } catch (error) {
      alert('Errore nel caricamento del file: ' + error.message);
    }
  };

  const filteredProducts = products.filter(product =>
    Object.values(product).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setQuantity("1");
    setDialogOpen(true);
  };

  const addProduct = () => {
    if (!selectedProduct) return;
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;

    const newTotal = total + (selectedProduct.price * qty);
    if (newTotal > BUDGET) {
      alert(`Superato il limite di budget di €${(newTotal - BUDGET).toFixed(2)}`);
      return;
    }

    const existing = selectedProducts.find(p => p.code === selectedProduct.code);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.code === selectedProduct.code 
          ? { ...p, quantity: p.quantity + qty, total: (p.quantity + qty) * p.price }
          : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, {
        ...selectedProduct,
        quantity: qty,
        total: selectedProduct.price * qty
      }]);
    }
    setTotal(newTotal);
    setDialogOpen(false);
  };

  const removeProduct = (product) => {
    setSelectedProducts(selectedProducts.filter(p => p.code !== product.code));
    setTotal(total - product.total);
  };

  const handlePrint = () => {
    setShowPrintView(true);
  };

  if (showPrintView) {
    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                   'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const date = new Date();
    const currentMonth = months[date.getMonth()];
    const currentYear = date.getFullYear();
    const titleText = `Lista di ${currentMonth} ${currentYear}`;

    return (
      <div className="p-4 bg-white min-h-screen">
        <div className="max-w-2xl mx-auto">
          <Button 
            className="mb-4" 
            onClick={() => setShowPrintView(false)}
          >
            Torna alla lista
          </Button>
          
          <h1 className="text-xl font-bold mb-4">{titleText}</h1>
          
          <table className="w-full mb-4 text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Codice</th>
                <th className="text-left p-2">Prodotto</th>
                <th className="text-right p-2">Q.tà</th>
                <th className="text-right p-2">Totale</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map(p => (
                <tr key={p.code} className="border-b">
                  <td className="p-2">{p.code}</td>
                  <td className="p-2">{p.product}</td>
                  <td className="p-2 text-right">{p.quantity}</td>
                  <td className="p-2 text-right">€{p.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="text-right">
            <p className="font-bold">Totale: €{total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto p-4">
          <Card className="dark:bg-gray-800 dark:text-white">
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    onClick={() => document.getElementById('file-upload').click()}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Upload size={16} />
                    Carica Excel
                  </Button>
                  <Input
                    placeholder="Cerca prodotti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs dark:bg-gray-700"
                    size="sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </div>

              <div>
                <div className="text-xs font-medium mb-1">Prodotti Disponibili ({filteredProducts.length})</div>
                <div className="h-48 overflow-y-auto border rounded-lg dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Codice</th>
                        <th className="text-left p-2">Prodotto</th>
                        <th className="text-right p-2">Prezzo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {filteredProducts.map(product => (
                        <tr 
                          key={product.code}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleProductClick(product)}
                        >
                          <td className="p-2">{product.code}</td>
                          <td className="p-2">{product.product}</td>
                          <td className="p-2 text-right">€{product.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium mb-1">Prodotti Selezionati ({selectedProducts.length})</div>
                <div className="h-48 overflow-y-auto border rounded-lg dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Codice</th>
                        <th className="text-left p-2">Prodotto</th>
                        <th className="text-right p-2">Q.tà</th>
                        <th className="text-right p-2">Totale</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {selectedProducts.map(product => (
                        <tr key={product.code}>
                          <td className="p-2">{product.code}</td>
                          <td className="p-2">{product.product}</td>
                          <td className="p-2 text-right">{product.quantity}</td>
                          <td className="p-2 text-right">€{product.total.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => removeProduct(product)}
                            >
                              Rimuovi
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrint}
                  className="text-xs"
                >
                  Stampa
                </Button>
                <div className="flex gap-4 text-sm">
                  <div>
                    Totale: <span className="font-bold">€{total.toFixed(2)}</span>
                  </div>
                  <div>
                    Rimanenza: <span className="font-bold">€{(BUDGET - total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle>Aggiungi prodotto</DialogTitle>
                </DialogHeader>
                {selectedProduct && (
                  <div className="py-4">
                    <h3 className="font-bold">{selectedProduct.product}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{selectedProduct.code}</p>
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">
                        Quantità:
                      </label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        className="w-24 dark:bg-gray-700"
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="font-medium">
                        {quantity} x {selectedProduct.product} = €{(selectedProduct.price * parseInt(quantity || 0)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Nuova rimanenza: €{(BUDGET - (total + (selectedProduct.price * parseInt(quantity || 0)))).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={addProduct}>
                    Aggiungi
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShoppingApp;