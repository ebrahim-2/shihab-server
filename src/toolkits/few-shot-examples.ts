export const examples = [
  {
    question: 'How many customers are there?',
    query: 'MATCH (c:Customer) RETURN count(DISTINCT c)',
  },
  {
    question: 'How many orders were placed?',
    query: 'MATCH (o:Order) RETURN count(DISTINCT o)',
  },
  {
    question: 'Which area has the most customers?',
    query:
      'MATCH (a:Area)<-[:LOCATED_IN]-(c:Customer) RETURN a.name, count(c) AS customerCount ORDER BY customerCount DESC LIMIT 1',
  },
  {
    question: 'What is the total discount amount given across all orders?',
    query: 'MATCH (o:Order) RETURN sum(o.discountAmount) AS totalDiscount',
  },
  {
    question: 'How many products are available?',
    query: 'MATCH (p:Product) RETURN count(DISTINCT p)',
  },
  {
    question: 'Which salesman has the highest total sales?',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)
      RETURN s.name, SUM(o.lineAmount) AS totalSales
      ORDER BY totalSales DESC
      LIMIT 1
    `,
  },
  {
    question: 'What is the total sales amount for each product?',
    query: `
      MATCH (p:Product)<-[:CONTAINS_PRODUCT]-(o:Order)
      RETURN p.name, SUM(o.lineAmount) AS totalSales
      ORDER BY totalSales DESC
    `,
  },
  {
    question: 'Which product is most frequently ordered?',
    query: `
      MATCH (p:Product)<-[:CONTAINS_PRODUCT]-(o:Order)
      RETURN p.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
      LIMIT 1
    `,
  },
  {
    question: 'How many times has each customer placed an order?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
    `,
  },
  {
    question: 'Which customer received the most discount?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, SUM(o.discountAmount) AS totalDiscount
      ORDER BY totalDiscount DESC
      LIMIT 1
    `,
  },
  {
    question: 'How many times has each customer placed an order?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
    `,
  },
  {
    question: 'What is the total sales amount for each area?',
    query: `
      MATCH (a:Area)<-[:DELIVERED_IN]-(o:Order)
      RETURN a.name, SUM(o.lineAmount) AS totalSales
      ORDER BY totalSales DESC
    `,
  },
  {
    question:
      'Which customer has received the most discount across all orders?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, SUM(o.discountAmount) AS totalDiscount
      ORDER BY totalDiscount DESC
      LIMIT 1
    `,
  },
  {
    question: 'Which customer orders the most diverse range of products?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN c.name, COUNT(DISTINCT p) AS uniqueProducts
      ORDER BY uniqueProducts DESC
      LIMIT 1
    `,
  },
  {
    question: 'How many products does each order contain?',
    query: `
      MATCH (o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN o.invoiceCode, COUNT(p) AS productCount
      ORDER BY productCount DESC
    `,
  },
  {
    question: 'Which area has the highest total number of orders placed?',
    query: `
      MATCH (a:Area)<-[:DELIVERED_IN]-(o:Order)
      RETURN a.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
      LIMIT 1
    `,
  },
  {
    question: 'Which product has generated the most revenue?',
    query: `
      MATCH (p:Product)<-[:CONTAINS_PRODUCT]-(o:Order)
      RETURN p.name, SUM(o.lineAmount) AS totalRevenue
      ORDER BY totalRevenue DESC
      LIMIT 1
    `,
  },
  {
    question: 'How many unique customers does each salesman serve?',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)<-[:PLACED_ORDER]-(c:Customer)
      RETURN s.name, COUNT(DISTINCT c) AS uniqueCustomers
      ORDER BY uniqueCustomers DESC
    `,
  },
  {
    question: 'What is the average discount per order for each customer?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, AVG(o.discountAmount) AS avgDiscount
      ORDER BY avgDiscount DESC
    `,
  },
  {
    question: 'Which salesman sells the most diverse range of products?',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN s.name, COUNT(DISTINCT p) AS uniqueProductsSold
      ORDER BY uniqueProductsSold DESC
      LIMIT 1
    `,
  },
  {
    question:
      'What is the most frequently purchased product by a specific customer?',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN p.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
      LIMIT 1
    `,
  },
  {
    question: 'How many customers are located in each area?',
    query: `
      MATCH (a:Area)<-[:LOCATED_IN]-(c:Customer)
      RETURN a.name, COUNT(c) AS customerCount
      ORDER BY customerCount DESC
    `,
  },
  {
    question: 'Which product batches are close to their expiry date?',
    query: `
      MATCH (o:Order)-[r:CONTAINS_PRODUCT]->(p:Product)
      WHERE r.expiryDate < datetime().plus({days: 30})
      RETURN p.name, r.batchNumber, r.expiryDate
      ORDER BY r.expiryDate ASC
    `,
  },
  {
    question: 'What is the total revenue generated by each salesman?',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)
      RETURN s.name, SUM(o.lineAmount) AS totalRevenue
      ORDER BY totalRevenue DESC
    `,
  },
  {
    question:
      'Which customers have placed orders with the highest total discount amount?',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, SUM(o.discountAmount) AS totalDiscount
      ORDER BY totalDiscount DESC
      LIMIT 10
    `,
  },
  {
    question:
      'كم عدد العملاء الذين يقومون بعمليات شراء متكررة؟ وما هو متوسط الوقت بين عمليات الشراء؟',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o1:Order)
      WITH c, COLLECT(o1.invoiceDate) AS orderDates
      WHERE SIZE(orderDates) > 1
      UNWIND RANGE(1, SIZE(orderDates) - 1) AS i
      WITH c, orderDates[i] AS previousDate, orderDates[i-1] AS currentDate
      RETURN c.name AS customer, COUNT(c) AS repeatPurchaseCount, AVG(DURATION.BETWEEN(currentDate, previousDate).days) AS averageDaysBetweenOrders
    `,
  },
  {
    question: 'ما هي المنتجات الأكثر شراءً من قبل العميل؟',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN p.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
      LIMIT 10
    `,
  },
  {
    question: 'ما هي أقل المنتجات شراءً من قبل العميل؟',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN p.name, COUNT(o) AS orderCount
      ORDER BY orderCount ASC
      LIMIT 10
    `,
  },
  {
    question: 'ما هو إجمالي مشتريات العميل؟',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)
      RETURN SUM(o.lineAmount) AS totalPurchases
    `,
  },
  {
    question: 'ما هي أوقات شراء العميل؟',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)
      RETURN o.invoiceDate AS purchaseTimes
      ORDER BY o.invoiceDate
    `,
  },
  {
    question: 'ما هو إجمالي مبلغ الخصم الذي تم تقديمه للعميل من جميع الطلبات؟',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)
      RETURN SUM(o.discountAmount) AS totalDiscount
    `,
  },
  {
    question: 'من هم الموزعون الذين قاموا بتوزيع المنتجات للعميل؟',
    query: `
      MATCH (c:Customer {code: $customerCode})-[:PLACED_ORDER]->(o:Order)<-[:SOLD_ORDER]-(s:Salesman)
      RETURN s.name AS salesman, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
    `,
  },
  {
    question: 'ما هي المناطق التي تحتوي على أكبر عدد من العملاء؟',
    query: `
      MATCH (a:Area)<-[:LOCATED_IN]-(c:Customer)
      RETURN a.name, COUNT(c) AS customerCount
      ORDER BY customerCount DESC
    `,
  },
  {
    question: 'ما هي المنتجات الأكثر تحقيقًا للإيرادات؟',
    query: `
      MATCH (p:Product)<-[:CONTAINS_PRODUCT]-(o:Order)
      RETURN p.name, SUM(o.lineAmount) AS totalRevenue
      ORDER BY totalRevenue DESC
      LIMIT 1
    `,
  },
  {
    question: 'كم عدد العملاء الفريدين الذين يخدمهم كل مندوب مبيعات؟',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)<-[:PLACED_ORDER]-(c:Customer)
      RETURN s.name, COUNT(DISTINCT c) AS uniqueCustomers
      ORDER BY uniqueCustomers DESC
    `,
  },
  {
    question: 'ما هو متوسط الخصم لكل طلب لكل عميل؟',
    query: `
      MATCH (c:Customer)-[:PLACED_ORDER]->(o:Order)
      RETURN c.name, AVG(o.discountAmount) AS avgDiscount
      ORDER BY avgDiscount DESC
    `,
  },
  {
    question: 'من هو مندوب المبيعات الذي يبيع أكثر تنوعًا من المنتجات؟',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)-[:CONTAINS_PRODUCT]->(p:Product)
      RETURN s.name, COUNT(DISTINCT p) AS uniqueProductsSold
      ORDER BY uniqueProductsSold DESC
      LIMIT 1
    `,
  },
  {
    question: 'ما هي المناطق التي تحتوي على أكبر عدد من العملاء؟',
    query: `
      MATCH (a:Area)<-[:LOCATED_IN]-(c:Customer)
      RETURN a.name, COUNT(c) AS customerCount
      ORDER BY customerCount DESC
    `,
  },
  {
    question: 'ما هي المنتجات التي تقترب تواريخ انتهاء صلاحيتها؟',
    query: `
      MATCH (o:Order)-[r:CONTAINS_PRODUCT]->(p:Product)
      WHERE r.expiryDate < datetime().plus({days: 30})
      RETURN p.name, r.batchNumber, r.expiryDate
      ORDER BY r.expiryDate ASC
    `,
  },
  {
    question: 'ما هو إجمالي الإيرادات التي تم تحقيقها من قبل كل مندوب مبيعات؟',
    query: `
      MATCH (s:Salesman)-[:SOLD_ORDER]->(o:Order)
      RETURN s.name, SUM(o.lineAmount) AS totalRevenue
      ORDER BY totalRevenue DESC
    `,
  },
  {
    question: 'ما هي المنتجات التي تحتوي على أكثر عدد من الطلبات؟',
    query: `
      MATCH (p:Product)<-[:CONTAINS_PRODUCT]-(o:Order)
      RETURN p.name, COUNT(o) AS orderCount
      ORDER BY orderCount DESC
      LIMIT 10
    `,
  },
];
