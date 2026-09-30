import { Stack, Pagination as MuiPaginationBase, Typography } from "@mui/material";

interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

export function MuiPagination({ page, pages, onChange }: Props) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mt: 3 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Page {page} of {pages}
      </Typography>
      <MuiPaginationBase
        count={pages}
        page={page}
        onChange={(_e, v) => onChange(v)}
        color="primary"
        shape="rounded"
        showFirstButton
        showLastButton
        sx={{ "& .MuiPaginationItem-root": { fontWeight: 600 } }}
      />
    </Stack>
  );
}
