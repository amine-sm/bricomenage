const pool = require("../config/db");

const DAY_NAMES = [
  "Dim.",
  "Lun.",
  "Mar.",
  "Mer.",
  "Jeu.",
  "Ven.",
  "Sam.",
];

const MONTH_NAMES = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function parseDate(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (
    Number.isNaN(date.getTime()) ||
    formatDateKey(date) !== value
  ) {
    return null;
  }

  return date;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + offset);
  return result;
}

function formatFrenchDate(date) {
  return new Intl.DateTimeFormat(
    "fr-DZ",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function resolvePeriod({
  period,
  startDate,
  endDate,
}) {
  const today = new Date();

  let start;
  let end;
  let type = period;

  if (period === "day") {
    start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    end = new Date(start);
  } else if (period === "week") {
    start = startOfWeek(today);
    end = addDays(start, 6);
  } else if (period === "custom") {
    start = parseDate(startDate);
    end = parseDate(endDate);

    if (!start || !end) {
      const error = new Error(
        "Format de date invalide. Utilisez AAAA-MM-JJ.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (start > end) {
      const error = new Error(
        "La date de début doit précéder la date de fin.",
      );
      error.statusCode = 400;
      throw error;
    }

    const maximumEnd =
      addDays(start, 730);

    if (end > maximumEnd) {
      const error = new Error(
        "L’intervalle ne peut pas dépasser deux ans.",
      );
      error.statusCode = 400;
      throw error;
    }
  } else {
    type = "month";
    start = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );
    end = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );
  }

  const differenceDays =
    Math.floor(
      (end.getTime() - start.getTime()) /
        86400000,
    ) + 1;

  let label;

  if (type === "day") {
    label = "Aujourd’hui";
  } else if (type === "week") {
    label = "Cette semaine";
  } else if (type === "month") {
    label = new Intl.DateTimeFormat(
      "fr-DZ",
      {
        month: "long",
        year: "numeric",
      },
    ).format(start);
  } else {
    label = `Du ${formatFrenchDate(
      start,
    )} au ${formatFrenchDate(end)}`;
  }

  return {
    type,
    start,
    end,
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
    differenceDays,
    label,
  };
}

async function getSingleValue(
  sql,
  params = [],
  field = "total",
) {
  const [rows] = await pool.execute(
    sql,
    params,
  );

  return Number(
    rows?.[0]?.[field] || 0,
  );
}

function createDailyBuckets(start, end) {
  const buckets = [];
  let cursor = new Date(start);

  while (cursor <= end) {
    buckets.push({
      key: formatDateKey(cursor),
      label:
        start.getTime() === end.getTime()
          ? `${pad(cursor.getHours())}h`
          : `${DAY_NAMES[cursor.getDay()]} ${pad(
              cursor.getDate(),
            )}`,
      revenue: 0,
      orders: 0,
    });

    cursor = addDays(cursor, 1);
  }

  return buckets;
}

function createHourlyBuckets() {
  return [0, 4, 8, 12, 16, 20].map(
    (hour) => ({
      key: String(hour),
      label: `${pad(hour)}h`,
      revenue: 0,
      orders: 0,
    }),
  );
}

function createMonthlyBuckets(start, end) {
  const buckets = [];
  let cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    1,
  );

  const last = new Date(
    end.getFullYear(),
    end.getMonth(),
    1,
  );

  while (cursor <= last) {
    buckets.push({
      key: `${cursor.getFullYear()}-${pad(
        cursor.getMonth() + 1,
      )}`,
      label: `${MONTH_NAMES[
        cursor.getMonth()
      ]} ${cursor.getFullYear()}`,
      revenue: 0,
      orders: 0,
    });

    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      1,
    );
  }

  return buckets;
}

async function getSalesChart(periodInfo) {
  const params = [
    periodInfo.startDate,
    periodInfo.endDate,
  ];

  let rows;
  let buckets;

  if (periodInfo.type === "day") {
    buckets = createHourlyBuckets();

    [rows] = await pool.execute(
      `
        SELECT
          FLOOR(HOUR(created_at) / 4) * 4 AS bucket_key,
          COUNT(*) AS orders,
          COALESCE(
            SUM(
              CASE
                WHEN status <> 'ANNULEE'
                THEN total
                ELSE 0
              END
            ),
            0
          ) AS revenue
        FROM orders
        WHERE created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY
          FLOOR(HOUR(created_at) / 4)
        ORDER BY bucket_key ASC
      `,
      params,
    );
  } else if (
    periodInfo.differenceDays <= 62
  ) {
    buckets = createDailyBuckets(
      periodInfo.start,
      periodInfo.end,
    );

    [rows] = await pool.execute(
      `
        SELECT
          DATE_FORMAT(
            created_at,
            '%Y-%m-%d'
          ) AS bucket_key,
          COUNT(*) AS orders,
          COALESCE(
            SUM(
              CASE
                WHEN status <> 'ANNULEE'
                THEN total
                ELSE 0
              END
            ),
            0
          ) AS revenue
        FROM orders
        WHERE created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE(created_at)
        ORDER BY bucket_key ASC
      `,
      params,
    );
  } else {
    buckets = createMonthlyBuckets(
      periodInfo.start,
      periodInfo.end,
    );

    [rows] = await pool.execute(
      `
        SELECT
          DATE_FORMAT(
            created_at,
            '%Y-%m'
          ) AS bucket_key,
          COUNT(*) AS orders,
          COALESCE(
            SUM(
              CASE
                WHEN status <> 'ANNULEE'
                THEN total
                ELSE 0
              END
            ),
            0
          ) AS revenue
        FROM orders
        WHERE created_at >= ?
          AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY
          DATE_FORMAT(
            created_at,
            '%Y-%m'
          )
        ORDER BY bucket_key ASC
      `,
      params,
    );
  }

  const chartMap = new Map(
    buckets.map((bucket) => [
      String(bucket.key),
      bucket,
    ]),
  );

  rows.forEach((row) => {
    const bucket = chartMap.get(
      String(row.bucket_key),
    );

    if (!bucket) {
      return;
    }

    bucket.orders = Number(
      row.orders || 0,
    );

    bucket.revenue = Number(
      row.revenue || 0,
    );
  });

  return Array.from(
    chartMap.values(),
  ).map((bucket) => ({
    label: bucket.label,
    revenue: bucket.revenue,
    orders: bucket.orders,
  }));
}

async function getDashboardStats(filters = {}) {
  const periodInfo =
    resolvePeriod({
      period: filters.period || "month",
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

  const dateCondition = `
    created_at >= ?
    AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
  `;

  const dateParams = [
    periodInfo.startDate,
    periodInfo.endDate,
  ];

  const [
    articles,
    categories,
    suppliers,
    orders,
    revenue,
    lowStock,
    pendingOrders,
    deliveredOrders,
    salesChart,
  ] = await Promise.all([
    getSingleValue(`
      SELECT COUNT(*) AS total
      FROM articles
    `),

    getSingleValue(`
      SELECT COUNT(*) AS total
      FROM categories
    `),

    getSingleValue(`
      SELECT COUNT(*) AS total
      FROM suppliers
    `),

    getSingleValue(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE ${dateCondition}
      `,
      dateParams,
    ),

    getSingleValue(
      `
        SELECT COALESCE(
          SUM(total),
          0
        ) AS total
        FROM orders
        WHERE status <> 'ANNULEE'
          AND ${dateCondition}
      `,
      dateParams,
    ),

    getSingleValue(`
      SELECT COUNT(*) AS total
      FROM articles
      WHERE stock_quantity <= min_stock
    `),

    getSingleValue(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE status IN (
          'NOUVELLE',
          'CONFIRMEE',
          'EN_PREPARATION',
          'EXPEDIEE',
          'EN_LIVRAISON'
        )
          AND ${dateCondition}
      `,
      dateParams,
    ),

    getSingleValue(
      `
        SELECT COUNT(*) AS total
        FROM orders
        WHERE status = 'LIVREE'
          AND ${dateCondition}
      `,
      dateParams,
    ),

    getSalesChart(periodInfo),
  ]);

  const [recentOrderRows] =
    await pool.execute(
      `
        SELECT
          id,
          tracking_number,
          customer_name,
          total,
          status,
          created_at
        FROM orders
        WHERE ${dateCondition}
        ORDER BY created_at DESC
        LIMIT 8
      `,
      dateParams,
    );

  return {
    period: {
      type: periodInfo.type,
      startDate: periodInfo.startDate,
      endDate: periodInfo.endDate,
      label: periodInfo.label,
    },

    stats: {
      articles,
      categories,
      suppliers,
      orders,
      revenue,
      lowStock,
      pendingOrders,
      deliveredOrders,
    },

    recentOrders:
      recentOrderRows.map(
        (order) => ({
          id: Number(order.id),
          tracking_number:
            order.tracking_number,
          customer_name:
            order.customer_name,
          total: Number(
            order.total || 0,
          ),
          status:
            order.status ||
            "NOUVELLE",
          created_at:
            order.created_at,
        }),
      ),

    salesChart,
  };
}

module.exports = {
  getDashboardStats,
};
