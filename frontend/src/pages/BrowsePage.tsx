import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box, Chip, Container, Grid, InputAdornment, MenuItem, Paper, Skeleton, Stack,
  Tab, Tabs, TextField, Typography, Button, Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterListOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { api, getApiErrorMessage } from "../api/client";
import type { LostItem, FoundItem } from "../types";
import { CATEGORIES } from "../types";
import ItemCard from "../components/ItemCard";
import PaginationFooter from "../components/Pagination";
import { useSnackbar } from "../contexts/SnackbarContext";

type Tab = "lost" | "found";

interface ListState<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const { notify } = useSnackbar();

  const tab: Tab = params.get("tab") === "found" ? "found" : "lost";
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const location = params.get("location") ?? "";
  const status = params.get("status") ?? "";
  const dateFrom = params.get("date_from") ?? "";
  const dateTo = params.get("date_to") ?? "";
  const sortBy = params.get("sort_by") ?? "created_at";
  const sortOrder = params.get("sort_order") ?? "desc";
  const page = Number(params.get("page") ?? "1");

  const [data, setData] = useState<ListState<LostItem | FoundItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          if (key !== "page") next.delete("page"); // reset pagination on filter change
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Instant (debounced) search from the text field.
  const onSearchInput = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 350);
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const endpoint = tab === "lost" ? "/lost-items" : "/found-items";
    api
      .get<{ data: ListState<LostItem> & ListState<FoundItem> }>(endpoint, {
        params: {
          q: q || undefined,
          category: category || undefined,
          location: location || undefined,
          status: status || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          limit: 12,
        },
        signal: controller.signal,
      })
      .then((res) => setData(res.data.data))
      .catch((err) => {
        if (err?.code !== "ERR_CANCELED") notify(getApiErrorMessage(err), "error");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, category, location, status, dateFrom, dateTo, sortBy, sortOrder, page]);

  const activeFilterCount = useMemo(
    () => [category, location, status, dateFrom, dateTo].filter(Boolean).length,
    [category, location, status, dateFrom, dateTo]
  );

  const items = data?.items ?? [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
        Browse Items
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Search the live database of lost and found reports
      </Typography>

      <Paper className="glass-panel" sx={{ p: 2, mb: 3, backgroundImage: "none" }}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <Tabs
            value={tab}
            onChange={(_e, v: Tab) => setParam("tab", v)}
            sx={{ minHeight: 40, "& .MuiTab-root": { fontWeight: 700, minHeight: 40 } }}
          >
            <Tab value="lost" label={`Lost (${data?.total ?? "…"})`} />
            <Tab value="found" label={`Found (${data?.total ?? "…"})`} />
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters((v) => !v)}
            sx={{ fontWeight: 700 }}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </Stack>

        <TextField
          fullWidth
          placeholder="Instant search — name, description or location…"
          value={searchInput}
          onChange={(e) => onSearchInput(e.target.value)}
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <Chip label="clear" size="small" onClick={() => onSearchInput("")} sx={{ cursor: "pointer" }} />
              </InputAdornment>
            ) : undefined,
            "aria-label": "Search items",
          }}
        />

        <Collapse in={showFilters}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Category" value={category} onChange={(e) => setParam("category", e.target.value)}>
                <MenuItem value="">All categories</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Location contains"
                value={location}
                onChange={(e) => setParam("location", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField select fullWidth label="Status" value={status} onChange={(e) => setParam("status", e.target.value)}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="RECOVERED">Returned</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={dateFrom}
                onChange={(e) => setParam("date_from", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="To"
                value={dateTo}
                onChange={(e) => setParam("date_to", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Sort by" value={sortBy} onChange={(e) => setParam("sort_by", e.target.value)}>
                <MenuItem value="created_at">Newest reported</MenuItem>
                <MenuItem value="date">Event date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="location">Location</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth label="Order" value={sortOrder} onChange={(e) => setParam("sort_order", e.target.value)}>
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {loading ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={310} sx={{ borderRadius: "16px" }} />
            </Grid>
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <Paper className="glass-panel" sx={{ p: 6, textAlign: "center", backgroundImage: "none" }}>
          <SearchOffIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>No items match your search</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Try different keywords, or clear a filter or two.
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {items.map((item, i) => {
              const isLost = tab === "lost";
              const rec = item as LostItem & FoundItem;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={rec.lost_id ?? rec.found_id}>
                  <ItemCard
                    item={{
                      id: (isLost ? rec.lost_id : rec.found_id) ?? "",
                      item_name: rec.item_name,
                      category: rec.category,
                      description: rec.description,
                      location: rec.location,
                      date: isLost ? rec.date_lost ?? "" : rec.date_found ?? "",
                      image_url: rec.image_url,
                      status: rec.status,
                      reporter_name: rec.reporter?.name,
                      kind: isLost ? "lost" : "found",
                    }}
                    index={i}
                  />
                </Grid>
              );
            })}
          </Grid>
          {data && (
            <PaginationFooter
              page={data.page}
              pages={data.pages}
              total={data.total}
              onChange={(p) => setParam("page", String(p))}
            />
          )}
        </>
      )}
    </Container>
  );
}
