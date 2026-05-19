export type PaymentType = 'money' | 'points' | 'both'
export type ProductStatus = 'active' | 'draft' | 'out' | 'archived'
export type OrderStatus = 'pending' | 'shipped' | 'completed' | 'redeemed' | 'cancelled'
export type ActivityKind = 'order' | 'eco' | 'amber' | 'blue'

export interface Product {
  id: number
  title: string
  cat: string
  catLabel: string
  glyph: string
  payment: PaymentType
  money: number
  points: number
  stock: number
  status: ProductStatus
  negotiable: boolean
  desc: string
  updated: string
}

export interface Order {
  id: string
  customer: string
  product: string
  paymentLabel: string
  payment: PaymentType
  status: OrderStatus
  date: string
}

export interface ActivityItem {
  kind: ActivityKind
  icon: string
  text: string
  time: string
}

export interface Category {
  id: string
  label: string
}
