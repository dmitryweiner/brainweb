import { AppNode, Declaration, SensorNode, EncoderNode, SensorPattern, FeatureOp, RegionNode, PopulationNode, ProjectionNode, TopologyExpr, WeightInitExpr, LearningRuleExpr, CircuitNode, ModulatorNode, EffectorNode, BindingNode, RuntimeNode, StepNode, GuardNode, TimeValue, NumberOrLen, PlasticityNode } from "./ast";
declare const BaseCstVisitor: new (...args: any[]) => import("chevrotain").ICstVisitor<any, any>;
declare class BrainWebCstVisitor extends BaseCstVisitor {
    constructor();
    program(ctx: any): AppNode;
    appDecl(ctx: any): AppNode;
    declaration(ctx: any): Declaration;
    sensorDecl(ctx: any): SensorNode;
    encoderDecl(ctx: any): EncoderNode;
    sensorPatternList(ctx: any): SensorPattern[];
    sensorPattern(ctx: any): SensorPattern;
    featureOp(ctx: any): FeatureOp;
    featureOpOnehot(ctx: any): FeatureOp;
    featureOpBucket(ctx: any): FeatureOp;
    featureOpHash(ctx: any): FeatureOp;
    featureOpNumeric(ctx: any): FeatureOp;
    featureOpClamp(ctx: any): FeatureOp;
    featureOpScale(ctx: any): FeatureOp;
    regionDecl(ctx: any): RegionNode;
    populationDecl(ctx: any): PopulationNode;
    statePopBody(ctx: any): {
        slots: number;
        decay: TimeValue;
        merge: string;
    };
    spikingPopBody(ctx: any): {
        neurons: number;
        tauMs: TimeValue;
        refrMs: TimeValue;
        targetRate: number;
        inhibition: string;
    };
    recurrentPopBody(ctx: any): {
        neurons: number;
        dt: TimeValue;
    };
    ratePopBody(ctx: any): {
        units: NumberOrLen;
    };
    wtaPopBody(ctx: any): {
        units: NumberOrLen;
    };
    numberOrLen(ctx: any): NumberOrLen;
    projectionDecl(ctx: any): ProjectionNode;
    qualifiedName(ctx: any): string;
    topologyExpr(ctx: any): TopologyExpr;
    sparseRandomExpr(ctx: any): TopologyExpr;
    localExpr(ctx: any): TopologyExpr;
    softmaxExpr(ctx: any): TopologyExpr;
    weightInitExpr(ctx: any): WeightInitExpr;
    normalInitExpr(ctx: any): WeightInitExpr;
    uniformInitExpr(ctx: any): WeightInitExpr;
    constantInitExpr(ctx: any): WeightInitExpr;
    learningRuleExpr(ctx: any): LearningRuleExpr;
    circuitDecl(ctx: any): CircuitNode;
    plasticityDecl(ctx: any): PlasticityNode;
    modulatorDecl(ctx: any): ModulatorNode;
    effectorDecl(ctx: any): EffectorNode;
    bindingDecl(ctx: any): BindingNode;
    runtimeDecl(ctx: any): RuntimeNode;
    stepCommand(ctx: any): StepNode;
    ingestStep(ctx: any): StepNode;
    runStep(ctx: any): StepNode;
    emitStep(ctx: any): StepNode;
    guardDecl(ctx: any): GuardNode;
    identifierList(ctx: any): string[];
}
export declare const visitorInstance: BrainWebCstVisitor;
export {};
//# sourceMappingURL=visitor.d.ts.map