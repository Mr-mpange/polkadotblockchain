import { render, screen } from '@testing-library/react'
import { MetricCard } from '../MetricCard'

describe('MetricCard', () => {
  it('renders metric title and value', () => {
    render(
      <MetricCard
        title="Total TVL"
        value="$1,234,567"
        icon="dollar"
        trend={{ value: 12.5, isPositive: true }}
      />
    )

    expect(screen.getByText('Total TVL')).toBeInTheDocument()
    expect(screen.getByText('$1,234,567')).toBeInTheDocument()
  })

  it('displays positive trend correctly', () => {
    render(
      <MetricCard
        title="Active Users"
        value="10,234"
        icon="users"
        trend={{ value: 5.2, isPositive: true }}
      />
    )

    expect(screen.getByText(/5.2%/)).toBeInTheDocument()
  })

  it('displays negative trend correctly', () => {
    render(
      <MetricCard
        title="Gas Fees"
        value="$0.05"
        icon="gas"
        trend={{ value: 3.1, isPositive: false }}
      />
    )

    expect(screen.getByText(/3.1%/)).toBeInTheDocument()
  })

  it('renders without trend when not provided', () => {
    render(
      <MetricCard
        title="Block Height"
        value="1,234,567"
        icon="block"
      />
    )

    expect(screen.getByText('Block Height')).toBeInTheDocument()
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })
})
