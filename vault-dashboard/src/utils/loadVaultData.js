import Papa from "papaparse";

// function to load and merge all CSV data from /public/data
export async function loadVaultData() {
  const files = [
    { key: "samples", path: "/data/samples.csv" },
    { key: "orders", path: "/data/orders.csv" },
    { key: "products", path: "/data/products.csv" },
    { key: "users", path: "/data/users.csv" },
  ];

  const parsed = await Promise.all(
    files.map(
      (f) =>
        new Promise((resolve) => {
          Papa.parse(f.path, {
            download: true,
            header: true,
            complete: (results) => resolve({ key: f.key, data: results.data }),
          });
        })
    )
  );

  // Convert results into an object: { samples, orders, products, users }
  const data = parsed.reduce((acc, { key, data }) => {
    acc[key] = data.filter((row) => Object.values(row).some((v) => v));
    return acc;
  }, {});

  // === MERGE LOGIC ===
  const unified = data.orders.map((order) => {
    const store = order["store__c.name__v"];
    const product = order["product__c.name__v"];
    const salesperson = order["salesperson__c.name__v"];

    const productInfo = data.products.find((p) => p["name__v"] === product);
    const samplesForStore = data.samples.filter(
      (s) =>
        s["store__c.name__v"] === store &&
        s["product__c.name__v"] === product
    );

    const totalSamples = samplesForStore.reduce(
      (sum, s) => sum + (parseFloat(s["quantity__c"]) || 0),
      0
    );
    const sampleCost = samplesForStore.reduce(
      (sum, s) => sum + (parseFloat(s["totalcost__c"]) || 0),
      0
    );

    return {
      store,
      salesperson,
      product,
      quantitySold: parseFloat(order["quantity__c"]) || 0,
      totalSales: parseFloat(order["total_price__c"]) || 0,
      profit: parseFloat(order["profit__c"]) || 0,
      profitPercent: parseFloat(order["profitpercentage__c"]) || 0,
      samplesGiven: totalSamples,
      sampleCost,
      unitCost: productInfo ? parseFloat(productInfo["cost__c"]) : null,
      sellingPrice: productInfo ? parseFloat(productInfo["selling_price__c"]) : null,
    };
  });

  return unified;
}
