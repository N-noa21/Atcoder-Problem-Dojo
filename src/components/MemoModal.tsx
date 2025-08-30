// src/components/MemoModal.tsx
import { useState, useEffect } from 'react';
import { Box, Modal, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useProblemStore, type Problem } from '../Data/problemStore';

interface MemoModalProps {
  open: boolean;
  onClose: () => void;
  problem: Problem | null;
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export const MemoModal = ({ open, onClose, problem }: MemoModalProps) => {
  const [memoText, setMemoText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const updateProblemMemo = useProblemStore((state) => state.updateProblemMemo);

  useEffect(() => {
    if (problem) {
      setMemoText(problem.memo || '');
    }
  }, [problem]);

  const handleSave = async () => {
    if (!problem) return;
    setIsSaving(true);
    await updateProblemMemo(problem.id, memoText);
    setIsSaving(false);
    onClose();
  };

  if (!problem) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2">
          Memo for: {problem.title}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          variant="outlined"
          sx={{ mt: 2, mb: 2 }}
          placeholder="ここにメモを入力..."
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
