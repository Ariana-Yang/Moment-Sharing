import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddButton } from '@/components/AddButton';

describe('AddButton Component', () => {
  it('should render button correctly', () => {
    const mockOnAdd = vi.fn();
    render(<AddButton onAdd={mockOnAdd} />);

    const button = screen.getByRole('button', { name: /添加记忆/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('fixed', 'bottom-8', 'right-8', 'z-50');
  });

  it('should call onAdd when clicked', async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();
    render(<AddButton onAdd={mockOnAdd} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();
    render(<AddButton onAdd={mockOnAdd} />);

    const button = screen.getByRole('button');
    await user.hover(button);

    const tooltip = screen.getByText('添加记忆');
    expect(tooltip).toBeInTheDocument();
  });

  it('should rotate icon on hover', async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();
    render(<AddButton onAdd={mockOnAdd} />);

    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');

    await user.hover(button);

    // Verify rotation transform is applied
    expect(icon).toHaveClass('group-hover:rotate-90');
  });
});
