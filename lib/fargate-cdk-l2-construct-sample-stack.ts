import * as path from "path";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class FargateCdkL2ConstructSampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });

    const cluster = new ecs.Cluster(this, "EcsCluster", { vpc });

    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef");

    taskDefinition.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, "../app")),
      portMappings: [{ containerPort: 80 }],
    });

    const service = new ecs.FargateService(this, "FargateService", {
      cluster,
      taskDefinition,
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
    });

    const listener = loadBalancer.addListener("PublicListener", {
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets("ECS", {
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        service.loadBalancerTarget({
          containerName: "AppContainer",
          containerPort: 80,
        }),
      ],
    });

    new CfnOutput(this, "applicationLoadBalancerURL", {
      value: "http://" + loadBalancer.loadBalancerDnsName,
    });
  }
}
