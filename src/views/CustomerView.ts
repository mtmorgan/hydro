import m from "mithril";
import Customer, { type CustomerRecord } from "../models/Customer";
import FileListItem from "./FileListItem";

interface AddressViewAttrs {
  addressData: CustomerRecord;
}

export const AddressView: m.Component<AddressViewAttrs> = {
  view: ({ attrs }) => {
    const { addressData } = attrs;

    if (!addressData) {
      return m(
        "div.card-panel.red.lighten-4",
        "Error: Could not display customer data.",
      );
    }

    return m("div.card-panel", [
      m("div", [
        m("strong", "Customer"),
        m(FileListItem, { name: Customer.fileName as string }),
      ]),
      m("strong", "Service Address: "),
      `${addressData.number} ${addressData.name},
				${addressData.town}, ${addressData.stateOrProvince}
				${addressData.postalCode}`,
      m("br"),
      m("strong", "Service Supplier: "),
      addressData.organisationName,
    ]);
  },
};

const CustomerView: m.Component = {
  view: () => [
    m("div", [
      Customer.address
        ? m(AddressView, { addressData: Customer.address })
        : m(
            "p.grey-text",
            "Choose a customer (",
            m("code", "Hydro1_Retail_Customer_*.xml"),
            ") file.",
          ),
    ]),
  ],
};

export default CustomerView;
