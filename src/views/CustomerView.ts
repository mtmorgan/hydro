import m from "mithril";
import { FileInput } from "mithril-materialized";
import Customer, { type Address } from "../models/Customer";
import { inputFileKey } from "../models/XMLFileInput";

const placeholder = "Hydro1_Retail_Customer XML file";

interface AddressViewAttrs {
	addressData: Address
}

export const AddressView: m.Component<AddressViewAttrs> = {
	view: ({ attrs }) => {
		const { addressData } = attrs;

		if (!addressData) {
			return m(
				"div.card-panel.red.lighten-4",
				"Error: Could not display customer data."
			);
		}

		return m("div.card-panel", [
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
			m(FileInput, {
				id: "customer",
				key: inputFileKey,
				placeholder: Customer.fileName || placeholder,
				multiple: false,
				accept: ["application/xml"],
				onchange: Customer.loadXml,
			}),
		]),
		Customer.address
			? m(AddressView, { addressData: Customer.address })
			: m("p.grey-text", "No customer data loaded."),
	],
};

export default CustomerView;
