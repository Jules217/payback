type CheckoutUrlOptions = {
  variantId: string;
  email: string;
  orgId: string;
};

type LSCheckoutResponse = {
  data: { attributes: { url: string } };
};

export async function getCheckoutUrl({
  variantId,
  email,
  orgId,
}: CheckoutUrlOptions): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!storeId || !apiKey) {
    throw new Error(
      "Lemon Squeezy n'est pas configuré (LEMONSQUEEZY_API_KEY ou LEMONSQUEEZY_STORE_ID manquant)."
    );
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            custom: { org_id: orgId },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Création du checkout échouée (${response.status}): ${text}`);
  }

  const json = (await response.json()) as LSCheckoutResponse;
  return json.data.attributes.url;
}
