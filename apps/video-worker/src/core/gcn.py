# Implementation for Graph Convolutional Network (GCN) layers

# libraries
import torch.nn as nn
from torch_geometric.nn import GCNConv, global_mean_pool, norm

# One GCN block: GCNConv -> GraphNorm -> activation -> dropout (optional)
class GCNLayer(nn.Module):
    def __init__(self, in_channels, out_channels, dropout=0.0):
        super().__init__()
        self.conv = GCNConv(in_channels, out_channels, improved=True)
        self.gnorm = norm.GraphNorm(out_channels)

        self.act = nn.LeakyReLU()
        self.drop = nn.Dropout(p=dropout) if dropout and dropout > 0 else nn.Identity()

    def forward(self, x, edge_index, batch_vector):
        x = self.conv(x, edge_index)
        x = self.gnorm(x, batch_vector)
        x = self.act(x)
        x = self.drop(x)
        return x
    
class GCNClassifier(nn.Module):
    def __init__(self, h1_channels, out_channels, num_classes, dropout=0.1):
        super().__init__()

        # GCN layers
        self.conv1 = GCNLayer(-1, h1_channels, dropout)
        self.conv2 = GCNLayer(h1_channels, out_channels, dropout)

        # other hyperparameters
        self.dropout = nn.Dropout(p=dropout)
        self.activation = nn.LeakyReLU()

        # FFN on graph-level embeddings
        self.mlp = nn.Sequential(
            nn.Linear(out_channels, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.LeakyReLU(),
            nn.Linear(32, num_classes),
        )

    def forward(self, x, edge_index, batch_vector):
        # GCN layer 1
        # x shape: [B * J, F] -> [B * J, h1_channels]
        x = self.conv1(x, edge_index, batch_vector)

        # GCN layer 2
        # x shape: [B * J, h1_channels] -> [B * J, out_channels]
        x = self.conv2(x, edge_index, batch_vector)

        # Pool nodes → one vector per graph
        # x shape: [B * J, out_channels] -> [B, out_channels]
        x = global_mean_pool(x, batch_vector)

        # Classification head
        # x shape: [B, out_channels] -> [B, num_classes]
        x = self.mlp(x)
        return x