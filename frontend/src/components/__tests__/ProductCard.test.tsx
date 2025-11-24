import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProductCard from '../ProductCard'
import { mockProducts } from '@/data/products'

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProductCard', () => {
  const mockProduct = mockProducts[0]
  const mockOnViewDetails = vi.fn()

  beforeEach(() => {
    mockOnViewDetails.mockClear()
  })

  it('renders product information correctly', () => {
    renderWithRouter(
      <ProductCard 
        product={mockProduct} 
        onViewDetails={mockOnViewDetails}
      />
    )

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument()
    expect(screen.getByAltText(mockProduct.name)).toBeInTheDocument()
  })

  it('calls onViewDetails when view button is clicked', () => {
    renderWithRouter(
      <ProductCard 
        product={mockProduct} 
        onViewDetails={mockOnViewDetails}
      />
    )

    const viewButton = screen.getByRole('button', { name: /ver detalles/i })
    fireEvent.click(viewButton)

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockProduct)
  })

  it('shows eco badge for eco products', () => {
    renderWithRouter(
      <ProductCard 
        product={mockProduct} 
        onViewDetails={mockOnViewDetails}
      />
    )

    if (mockProduct.isEco) {
      expect(screen.getByText(/eco/i)).toBeInTheDocument()
    }
  })
})