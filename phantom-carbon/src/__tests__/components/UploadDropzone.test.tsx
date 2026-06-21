import { render, screen } from '@testing-library/react';
import { UploadDropzone } from '@/components/upload/UploadDropzone';

jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false,
    acceptedFiles: [],
  }),
}));

describe('UploadDropzone', () => {
  it('renders accessible upload region with description', () => {
    render(<UploadDropzone onUpload={jest.fn()} />);

    expect(screen.getByRole('button', { name: /upload receipt/i })).toBeInTheDocument();
    expect(screen.getByText(/drop your receipt here/i)).toBeInTheDocument();
    expect(screen.getByText(/supports pdf, jpeg, png, webp/i)).toBeInTheDocument();
  });

  it('shows loading state with aria-live announcement', () => {
    render(<UploadDropzone onUpload={jest.fn()} isUploading loadingLabel="Analyzing receipt…" />);

    expect(screen.getByLabelText('Analyzing receipt…')).toBeInTheDocument();
  });
});
