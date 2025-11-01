import { Pagination } from '../interfaces/pagination.interface';

export const toNumber = (value: number, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const getPagination = (
  page: number = 1,
  limit: number = 10,
): { pageNum: number; limitNum: number; skip: number; take: number } => {
  const pageNum = Math.max(1, toNumber(page, 1));
  const limitNum = Math.max(1, Math.min(100, toNumber(limit, 10)));
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;
  return { pageNum, limitNum, skip, take };
};

export const buildPagination = <T>(
  docs: T[],
  totalDocs: number,
  pageNum: number,
  limitNum: number,
): Pagination<T> => {
  const totalPages = Math.max(1, Math.ceil(totalDocs / limitNum));
  const pagingCounter = (pageNum - 1) * limitNum + 1;
  const hasPrevPage = pageNum > 1;
  const hasNextPage = pageNum < totalPages;
  const prevPage = hasPrevPage ? pageNum - 1 : null;
  const nextPage = hasNextPage ? pageNum + 1 : null;

  return {
    docs,
    totalDocs,
    limit: limitNum,
    totalPages,
    page: pageNum,
    pagingCounter,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
  };
};
