function ResetMeasurement(e) {
    measurement.setTool("area", false);
    measurement.setTool("distance", false);
    measurement.clearResult();
}

function MeasureEnd(e) {
    measurement.setTool(measurement.activeTool, false);
}