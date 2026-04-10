package com.quanlybanhang.model;

/** Giá trị status phải khớp ENUM trong MySQL — chỉnh nếu schema khác. */
public final class DomainConstants {

  private DomainConstants() {}

  public static final String STATUS_ACTIVE = "active";
  public static final String STATUS_INACTIVE = "inactive";

  public static final String RECEIPT_DRAFT = "draft";
  public static final String RECEIPT_COMPLETED = "completed";
  public static final String RECEIPT_CANCELLED = "cancelled";

  public static final String INV_TX_GOODS_RECEIPT = "goods_receipt";
  public static final String INV_TX_SALE = "sale";

  public static final String ORDER_DRAFT = "draft";
  public static final String ORDER_COMPLETED = "completed";
  public static final String ORDER_CANCELLED = "cancelled";

  public static final String PAYMENT_STATUS_UNPAID = "unpaid";
  public static final String PAYMENT_STATUS_PAID = "paid";

  /** Thu tiền bán hàng (ENUM payment_type thường là in/out). */
  public static final String PAYMENT_TYPE_IN = "in";

  public static final String REF_TYPE_SALES_ORDER = "sales_order";
  public static final String REF_TYPE_SALES_RETURN = "sales_return";

  public static final String RETURN_DRAFT = "draft";
  public static final String RETURN_COMPLETED = "completed";

  public static final String INV_TX_SALE_RETURN = "sale_return";

  public static final String TRANSFER_DRAFT = "draft";
  public static final String TRANSFER_COMPLETED = "completed";
  public static final String INV_TX_TRANSFER_OUT = "transfer_out";
  public static final String INV_TX_TRANSFER_IN = "transfer_in";
  public static final String REF_TYPE_STOCK_TRANSFER = "stock_transfer";

  public static final String STOCKTAKE_DRAFT = "draft";
  public static final String STOCKTAKE_COMPLETED = "completed";
  public static final String INV_TX_STOCKTAKE_ADJUST = "stocktake_adj";
  public static final String REF_TYPE_STOCKTAKE = "stocktake";
}
