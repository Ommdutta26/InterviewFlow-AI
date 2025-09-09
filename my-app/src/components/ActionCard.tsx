import { QuickActionType } from "@/constants";
import { Card } from "./ui/card";

function ActionCard({ action, onClick }: { action: QuickActionType; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="group relative overflow-hidden cursor-pointer rounded-2xl 
                 backdrop-blur-md bg-white/5 border border-white/10 
                 hover:bg-white/10 hover:shadow-xl transition-all duration-300"
    >
      {/* Gradient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-30 group-hover:opacity-50 transition-opacity rounded-2xl`}
      />

      {/* Content */}
      <div className="relative p-6 flex flex-col items-start gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center 
                      bg-${action.color}/20 group-hover:scale-110 transition-transform`}
        >
          <action.icon className={`h-7 w-7 text-${action.color}`} />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-white group-hover:text-${action.color} transition-colors">
            {action.title}
          </h3>
          <p className="text-gray-300 text-sm">{action.description}</p>
        </div>
      </div>
    </Card>
  );
}

export default ActionCard;
