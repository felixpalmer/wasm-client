import DeckGL from '@deck.gl/react'; 
import {Map} from 'react-map-gl/maplibre';  

import { DuckDBRow, MDConnection } from "@motherduck/wasm-client";
import { EventProps } from "@tremor/react";
import { useCallback, useEffect, useState } from "react";
import "./ChartsPane.css";
import { ComplaintTypesForYearChart } from "./ComplaintTypesForYearChart";
import { ComplaintsByYearChart } from "./ComplaintsByYearChart";
import { compaintsByYearSql, complaintTypesForYearSql } from "./sql";
import {ScatterplotLayer} from 'deck.gl';

const noData: readonly DuckDBRow[] = [];

const mapStyle = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.7,
  zoom: 8
}

export function ChartsPane({ connection }: { connection: MDConnection }) {
  const [complaintsByYearData, setComplaintsByYearData] =
    useState<readonly DuckDBRow[] | null>(null);

  const [loadingOpacity, setLoadingOpacity] = useState(0);

  useEffect(() => {
    setLoadingOpacity(1);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (connection) {
        const result = await connection.evaluateQuery(compaintsByYearSql);
        const rows = result.data.toRows();
        setComplaintsByYearData(rows);
      }
    }
    fetchData().catch(console.error);
  }, [connection]);

  const [complaintTypesForYearData, setComplaintTypesForYearData] =
    useState<readonly DuckDBRow[]>(noData);

  const handleValueChange = useCallback(
    async (value: EventProps) => {
      if (connection && value) {
        const year = Number(value["Year"]);
        const sql = complaintTypesForYearSql(year);
        const result = await connection.evaluateQuery(sql);
        const rows = result.data.toRows();
        setComplaintTypesForYearData(rows);
      } else {
        setComplaintTypesForYearData(noData);
      }
    },
    [connection]
  );


  const layers = [complaintTypesForYearData && new ScatterplotLayer({
    data: complaintTypesForYearData,
    getPosition: d => [d.longitude, d.latitude],
    radiusMinPixels: 3
  })];

  return complaintsByYearData ? (
    <div id="charts-pane">
      <ComplaintsByYearChart
        complaintsByYearData={complaintsByYearData}
        handleValueChange={handleValueChange}
      />
      {complaintTypesForYearData.length > 0 ? (
        <div style={{position: 'relative', background: 'red', height: 300}}>
          <DeckGL layers={layers} initialViewState={INITIAL_VIEW_STATE} controller={true}>
            <Map reuseMaps mapStyle={mapStyle} /> 
          </DeckGL>

        </div>
      ) : null}
    </div>
  ) : (
    <div
      id="loading-pane"
      style={{
        opacity: loadingOpacity,
        transform: `translateY(${(1 - loadingOpacity) * 8}px)`,
      }}
    >
      Loading…
    </div>
  );
}
