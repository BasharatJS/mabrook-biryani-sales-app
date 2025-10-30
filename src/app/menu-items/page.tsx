'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import MenuItemForm from '@/components/forms/MenuItemForm'
import MenuItemsList from '@/components/menu-items/MenuItemsList'
import Modal from '@/components/ui/Modal'
// import BulkMenuItemsButton from '@/components/admin/BulkMenuItemsButton';

export default function MenuItemsPage() {
  const [showMenuItemForm, setShowMenuItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleMenuItemSuccess = () => {
    setShowMenuItemForm(false)
    setEditingItem(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setShowMenuItemForm(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setShowMenuItemForm(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
          <button
            onClick={handleAddNew}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Add Menu Item
          </button>
        </div>

        {/* <BulkMenuItemsButton
          onComplete={() => setRefreshTrigger(prev => prev + 1)}
        /> */}

        <MenuItemsList
          refreshTrigger={refreshTrigger}
          onEditItem={handleEditItem}
        />

        <Modal
          isOpen={showMenuItemForm}
          onClose={() => {
            setShowMenuItemForm(false)
            setEditingItem(null)
          }}
          size="lg"
        >
          <MenuItemForm
            editingItem={editingItem}
            onSuccess={handleMenuItemSuccess}
            onCancel={() => {
              setShowMenuItemForm(false)
              setEditingItem(null)
            }}
          />
        </Modal>
      </div>
    </AppLayout>
  )
}
