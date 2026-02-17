export interface ActionSelectorConfig {
    actions: string[];
    featureDim: number;
    temperature: number;
    seed: number;
}
export declare class ActionSelector {
    private actions;
    private weights;
    private featureDim;
    private temperature;
    private values;
    private probs;
    constructor(config: ActionSelectorConfig);
    step(contextFeatures: Float32Array): {
        winner: number;
        values: Float32Array;
        probs: Float32Array;
    };
    getActions(): string[];
}
//# sourceMappingURL=actionSelector.d.ts.map