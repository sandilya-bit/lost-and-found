import { MuiPagination } from "./PaginationParts";

interface Props {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}

export default function PaginationFooter({ page, pages, total, onChange }: Props) {
  if (total === 0) return null;
  return <MuiPagination page={page} pages={pages} onChange={onChange} />;
}
