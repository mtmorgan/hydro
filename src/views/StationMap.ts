import m from "mithril";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Ensure CSS is imported
import { Stations, StationRecord } from "../models/Stations";
import { lollipopIcon } from "../utils/map";

interface StationMapAttrs {
  activeId?: string;
  onSelect: (id: string) => void;
}

export const StationMap: m.FactoryComponent<StationMapAttrs> = () => {
  let map: L.Map;

  return {
    oncreate: (vnode) => {
      // Initialize map on the DOM element
      map = L.map(vnode.dom as HTMLElement).setView([43.6532, -79.3832], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        crossOrigin: true,
      }).addTo(map);

      // Add markers for all stations
      Stations.list.forEach((s: StationRecord) => {
        const marker = L.marker([s.Latitude, s.Longitude], {
          icon: lollipopIcon,
        }).addTo(map);

        // Construct a detailed popup
        marker.bindPopup(`
                    <div class="station-popup">
                        <b>${s.Name}</b><br>
                        ID: ${s.StationId}<br>
                        Elev: ${s.Elevation}m<br>
                        <small>${s.Latitude.toFixed(4)}, ${s.Longitude.toFixed(
                          4,
                        )}</small>
                    </div>
                `);

        marker.on("click", () => vnode.attrs.onSelect(s.StationId));
      });
    },

    onremove: () => {
      if (map) map.remove();
    },

    view: () =>
      m("#station-map", { style: { height: "500px", width: "100%" } }),
  };
};
