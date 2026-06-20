import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '@/components/chat/ChatInterface';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetchSuccess = () =>
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      data: {
        logId: 'log-123',
        extraction: {
          surfaceCarbon: 2.1,
          shadowCarbon: 0,
          ghostCarbon: 0,
          totalCarbon: 2.1,
          breakdown: { transport: 2.1 },
          confidence: 0.9,
          sources: ['Car journey'],
          summary: 'Your car generated 2.1 kg CO2e.',
          topAction: 'Try cycling.',
        },
      },
    }),
  });

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSuccess();
  });

  it('renders empty state with example prompts', () => {
    render(<ChatInterface />);
    expect(screen.getByText('Detect your phantom carbon')).toBeInTheDocument();
    expect(screen.getByText(/Try an example/i)).toBeInTheDocument();
  });

  it('renders input with correct accessibility attributes', () => {
    render(<ChatInterface />);
    const input = screen.getByRole('textbox', { name: /Describe your carbon activities/i });
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('send button has accessible label', () => {
    render(<ChatInterface />);
    const button = screen.getByRole('button', { name: /Send message and analyze/i });
    expect(button).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInterface />);
    const sendButton = screen.getByRole('button', { name: /Send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('clears input after submit', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);

    const input = screen.getByRole('textbox', { name: /Describe your carbon activities/i });
    await user.type(input, 'I drove 10km to work in my car today');

    const sendButton = screen.getByRole('button', { name: /Send message/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('displays carbon badge after successful extraction', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);

    const input = screen.getByRole('textbox', { name: /Describe your carbon activities/i });
    await user.type(input, 'I drove 10km to work today in my petrol car');

    const sendButton = screen.getByRole('button', { name: /Send message/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Your car generated 2.1 kg CO2e.')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully with user-friendly message', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error occurred' }),
    });

    const user = userEvent.setup();
    render(<ChatInterface />);

    const input = screen.getByRole('textbox', { name: /Describe your carbon activities/i });
    await user.type(input, 'I drove 10km to work today in my petrol car');

    const sendButton = screen.getByRole('button', { name: /Send message/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getAllByText(/Unable to analyze right now/i).length).toBeGreaterThan(0);
    });
  });

  it('has conversation log with accessible role', () => {
    render(<ChatInterface />);
    const log = screen.getByRole('log', { name: /Chat conversation/i });
    expect(log).toBeInTheDocument();
  });

  it('supports keyboard submission with Enter key', async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);

    const input = screen.getByRole('textbox', { name: /Describe your carbon activities/i });
    await user.type(input, 'I drove 10km to work in my car');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('is accessible — all interactive elements have labels', () => {
    render(<ChatInterface />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn: HTMLElement) => {
      expect(btn).toHaveAccessibleName();
    });
  });
});
