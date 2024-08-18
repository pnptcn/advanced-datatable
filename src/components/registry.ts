class ComponentRegistry {
    private components: Record<string, any> = {};

    register(name: string, instance: any) {
        this.components[name] = instance;
    }

    get(name: string) {
        return this.components[name];
    }

    init() {
        // Initialize all components in the correct order
        Object.values(this.components).forEach((component: any) => {
            if (component.initialize) {
                component.initialize(this);
            }
        });
    }
}

export const registry = new ComponentRegistry();
