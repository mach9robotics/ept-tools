type TypedArray = Float32Array | Uint32Array | Uint16Array | Uint8Array | Int16Array | Int8Array;

import 'draco3d';

export interface EncoderModule {
    PointCloudBuilder: new () => PointCloudBuilder;
}

export interface PointCloud {}

type PointCloudAttributeFunction = (pc: PointCloud, dracoType: number, pointsLength: number, numberOfComponents: number, typedArray: TypedArray) => number;

export interface PointCloudBuilder {
    AddUInt8Attribute: PointCloudAttributeFunction;
    AddInt8Attribute: PointCloudAttributeFunction;
    AddUInt16Attribute: PointCloudAttributeFunction;
    AddInt16Attribute: PointCloudAttributeFunction;
    AddUInt32Attribute: PointCloudAttributeFunction;
    AddInt32Attribute: PointCloudAttributeFunction;
    AddFloatAttribute: PointCloudAttributeFunction;
}
